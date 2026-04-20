const prisma = require("../../config/db.config");
const { redisClient } = require("../../config/redis.config");

// Safe field selection — never expose password hash
const SAFE_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    profileImage: true,
    role: true,
    status: true,
    schoolId: true,
    address: true,
    createdAt: true,
    updatedAt: true,
};

class UserService {

    /**
     * Fetch a single user matching the given Prisma filter.
     * Used internally by auth middleware.
     */
    getSingleUserByFilter = async (filter) => {
        try {
            const user = await prisma.user.findFirst({ where: filter });
            if (!user) throw { status: 401, message: "Credentials do not match" };
            return user;
        } catch (exception) {
            console.error("[UserService] getSingleUserByFilter:", exception);
            throw exception;
        }
    };

    /**
     * Activate / deactivate a principal (super-admin only).
     */
    updatePrincipleStatus = async (id, data) => {
        try {
            const user = await prisma.user.update({ where: { id }, data });
            const keys = await redisClient.keys(`users:list:${user.schoolId}:*`);
            if (keys.length > 0) await redisClient.del(keys);
            await redisClient.del(`user:${id}:${user.schoolId}`);
            return user;
        } catch (exception) {
            console.error("[UserService] updatePrincipleStatus:", exception);
            throw exception;
        }
    };

    /**
     * Create a new user (admin-staff or accountant).
     */
    createUser = async (data) => {
        try {
            const user = await prisma.user.create({ data, select: SAFE_SELECT });
            const keys = await redisClient.keys(`users:list:${user.schoolId}:*`);
            if (keys.length > 0) await redisClient.del(keys);
            return user;
        } catch (exception) {
            console.error("[UserService] createUser:", exception);
            throw exception;
        }
    };

    /**
     * List users in a school filtered to specific roles.
     * Supports cursor-based pagination via page/limit.
     *
     * @param {string}   schoolId  - School scope
     * @param {string[]} roles     - Roles caller is allowed to see
     * @param {number}   page      - 1-indexed page number
     * @param {number}   limit     - Records per page (max 100)
     * @returns {{ data: User[], total: number, page: number, limit: number }}
     */
    listUsers = async (schoolId, roles, page = 1, limit = 20) => {
        try {
            const safeLimit = Math.min(Number(limit) || 20, 100);
            const safePage  = Math.max(Number(page)  || 1,  1);
            const skip      = (safePage - 1) * safeLimit;

            const cacheKey = `users:list:${schoolId}:${roles.join(",")}:${safePage}:${safeLimit}`;
            const cachedUsers = await redisClient.get(cacheKey);
            if (cachedUsers) return JSON.parse(cachedUsers);

            const where = { schoolId, role: { in: roles } };

            const [data, total] = await prisma.$transaction([
                prisma.user.findMany({
                    where,
                    select: SAFE_SELECT,
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: safeLimit,
                }),
                prisma.user.count({ where }),
            ]);

            const result = { data, total, page: safePage, limit: safeLimit };
            await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
            return result;
        } catch (exception) {
            console.error("[UserService] listUsers:", exception);
            throw exception;
        }
    };

    /**
     * Fetch a single user scoped to a school.
     *
     * @param {string} id       - Target user id
     * @param {string} schoolId - Must match to prevent cross-school access
     */
    getUserById = async (id, schoolId) => {
        try {
            const cacheKey = `user:${id}:${schoolId}`;
            const cachedUser = await redisClient.get(cacheKey);
            if (cachedUser) return JSON.parse(cachedUser);

            const user = await prisma.user.findFirst({
                where: { id, schoolId },
                select: SAFE_SELECT,
            });
            if (!user) throw { status: 404, message: "User not found" };

            await redisClient.setEx(cacheKey, 600, JSON.stringify(user));
            return user;
        } catch (exception) {
            console.error("[UserService] getUserById:", exception);
            throw exception;
        }
    };

    /**
     * Admin-driven update of another user's profile.
     * Strips protection fields before writing.
     *
     * @param {string} id       - Target user id
     * @param {string} schoolId - School scope guard
     * @param {object} data     - Raw update payload (will be sanitised)
     */
    updateUser = async (id, schoolId, data) => {
        try {
            // Strip fields that only super-admin / system should change
            const { role, schoolId: _sid, ...safeData } = data;

            // Confirm user exists in the same school before updating
            const existing = await prisma.user.findFirst({ where: { id, schoolId } });
            if (!existing) throw { status: 404, message: "User not found" };

            const updatedUser = await prisma.user.update({
                where: { id },
                data: safeData,
                select: SAFE_SELECT,
            });

            const keys = await redisClient.keys(`users:list:${schoolId}:*`);
            if (keys.length > 0) await redisClient.del(keys);
            await redisClient.del(`user:${id}:${schoolId}`);

            return updatedUser;
        } catch (exception) {
            console.error("[UserService] updateUser:", exception);
            throw exception;
        }
    };

    /**
     * Self-update — only the logged-in user can update their own record.
     * Role, status, and schoolId are never touched.
     *
     * @param {string} id   - Authenticated user's own id
     * @param {object} data - Raw payload (will be sanitised)
     */
    updateSelf = async (id, data) => {
        try {
            // Strip anything that would elevate privileges
            const { role, status, schoolId, ...safeData } = data;

            const updatedUser = await prisma.user.update({
                where: { id },
                data: safeData,
                select: SAFE_SELECT,
            });

            const userSchoolId = updatedUser.schoolId;
            const keys = await redisClient.keys(`users:list:${userSchoolId}:*`);
            if (keys.length > 0) await redisClient.del(keys);
            await redisClient.del(`user:${id}:${userSchoolId}`);

            return updatedUser;
        } catch (exception) {
            console.error("[UserService] updateSelf:", exception);
            throw exception;
        }
    };

    /**
     * Hard-delete a user, scoped to a school.
     *
     * @param {string} id       - Target user id
     * @param {string} schoolId - School scope guard
     */
    deleteUser = async (id, schoolId) => {
        try {
            const existing = await prisma.user.findFirst({ where: { id, schoolId } });
            if (!existing) throw { status: 404, message: "User not found" };

            await prisma.user.delete({ where: { id } });

            const keys = await redisClient.keys(`users:list:${schoolId}:*`);
            if (keys.length > 0) await redisClient.del(keys);
            await redisClient.del(`user:${id}:${schoolId}`);

            return { id };
        } catch (exception) {
            console.error("[UserService] deleteUser:", exception);
            throw exception;
        }
    };
}

module.exports = new UserService();