const { Role, Status } = require("../../config/constant.config");
const userService = require("./user.service");
const { getCache, setCache, clearCache } = require("../../utils/redisCache");
const bcrypt = require("bcryptjs");

// Cache TTL constants
const LIST_TTL    = 300; // 5 min  — list pages
const DETAIL_TTL  = 300; // 5 min  — single user

class UserController {

    // ─── helpers ───────────────────────────────────────────────────────────

    /** Cache key for a paginated list scoped to caller role */
    #listKey = (schoolId, callerRole, page, limit) =>
        `users:${schoolId}:${callerRole}:${page}:${limit}`;

    /** Cache key for a single user */
    #userKey = (id) => `user:${id}`;

    /** Roles that each caller is allowed to see in the list */
    #visibleRoles = (callerRole) => {
        if (callerRole === Role.PRINCIPAL)  return [Role.ADMIN_STAFF, Role.ACCOUNTANT];
        if (callerRole === Role.ADMIN_STAFF) return [Role.ACCOUNTANT];
        return null; // not authorised
    };

    // ─── principal status (super-admin only) ───────────────────────────────

    updatePrincipalStatus = async (req, res, next) => {
        try {
            const { id } = req.params;
            const response = await userService.updatePrincipleStatus(id, req.body);
            // Invalidate any cached entry for this user and the schools list where principal data is embedded
            await clearCache(this.#userKey(id));
            await clearCache("schools_list_*");   // Layer 1 (Controller)
            await clearCache("schools:list:*");     // Layer 2 (Service)
            res.json({ result: response, message: "Updated principal status", meta: null });
        } catch (error) {
            console.error("[UserController] updatePrincipalStatus:", error);
            next(error);
        }
    };

    // ─── create ────────────────────────────────────────────────────────────

    createAdminStaff = async (req, res, next) => {
        try {
            const data = {
                ...req.body,
                password : bcrypt.hashSync(req.body.password, 10),
                schoolId: req.authUser.schoolId,
                role:     Role.ADMIN_STAFF,
                status:   Status.ACTIVE,
            };
            const response = await userService.createUser(data);
            // Invalidate list cache for this school
            await clearCache(`users:${req.authUser.schoolId}:*`);
            res.status(201).json({ result: response, message: "Admin staff created successfully", meta: null });
        } catch (error) {
            console.error("[UserController] createAdminStaff:", error);
            next(error);
        }
    };

    createAccountant = async (req, res, next) => {
        try {
            const data = {
                ...req.body,
                password : bcrypt.hashSync(req.body.password, 10),
                schoolId: req.authUser.schoolId,
                role:     Role.ACCOUNTANT,
                status:   Status.ACTIVE,
            };
            const response = await userService.createUser(data);
            await clearCache(`users:${req.authUser.schoolId}:*`);
            res.status(201).json({ result: response, message: "Accountant created successfully", meta: null });
        } catch (error) {
            console.error("[UserController] createAccountant:", error);
            next(error);
        }
    };

    // ─── list ──────────────────────────────────────────────────────────────

    /**
     * GET /users/
     * - PRINCIPAL   → sees admin_staff + accountant
     * - ADMIN_STAFF → sees accountant only
     *
     * Cached per (schoolId, callerRole, page, limit).
     */
    listUsers = async (req, res, next) => {
        try {
            const { schoolId, role: callerRole } = req.authUser;
            const { page = 1, limit = 20 } = req.query;

            const roles = this.#visibleRoles(callerRole);
            if (!roles) {
                return res.status(403).json({ message: "Not authorized to list users" });
            }

            const cacheKey = this.#listKey(schoolId, callerRole, page, limit);
            const cached = await getCache(cacheKey);
            if (cached) {
                return res.json({ result: cached, message: "Users fetched (cache)", meta: null });
            }

            const result = await userService.listUsers(schoolId, roles, page, limit);
            await setCache(cacheKey, result, LIST_TTL);

            res.json({ result, message: "Users fetched", meta: null });
        } catch (error) {
            console.error("[UserController] listUsers:", error);
            next(error);
        }
    };

    // ─── get by id ─────────────────────────────────────────────────────────

    /**
     * GET /users/:id
     * `loadTargetUser` already validated the user exists and set `req.targetUser`.
     * `canManageUser` already verified the caller can manage the target.
     * We just return the cached/DB value.
     */
    getUserById = async (req, res, next) => {
        try {
            // targetUser was loaded (and cached) by loadTargetUser middleware
            const user = req.targetUser;
            res.json({ result: user, message: "User fetched", meta: null });
        } catch (error) {
            console.error("[UserController] getUserById:", error);
            next(error);
        }
    };

    // ─── update (admin managing someone) ──────────────────────────────────

    /**
     * PUT /users/:id
     * `canManageUser` already verified hierarchy.
     */
    updateUser = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { schoolId } = req.authUser;
            const data = req.body;
            if(data.password){
                data.password = bcrypt.hashSync(data.password, 10);
            }
            const response = await userService.updateUser(id, schoolId, data);

            // Invalidate single-user cache + all list pages for this school
            await Promise.all([
                clearCache(this.#userKey(id)),
                clearCache(`users:${schoolId}:*`),
            ]);

            res.json({ result: response, message: "User updated successfully", meta: null });
        } catch (error) {
            console.error("[UserController] updateUser:", error);
            next(error);
        }
    };

    // ─── self update ───────────────────────────────────────────────────────

    /**
     * PUT /users/me
     * Only the authenticated user can update their own profile.
     * Role, status, schoolId are silently ignored even if sent.
     */
    updateSelf = async (req, res, next) => {
        try {
            const { id } = req.authUser;

            const response = await userService.updateSelf(id, req.body);

            // Invalidate own user cache
            await clearCache(this.#userKey(id));

            res.json({ result: response, message: "Profile updated successfully", meta: null });
        } catch (error) {
            console.error("[UserController] updateSelf:", error);
            next(error);
        }
    };

    // ─── delete ────────────────────────────────────────────────────────────

    /**
     * DELETE /users/:id
     * `canManageUser` already verified hierarchy.
     */
    deleteUser = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { schoolId } = req.authUser;

            await userService.deleteUser(id, schoolId);

            await Promise.all([
                clearCache(this.#userKey(id)),
                clearCache(`users:${schoolId}:*`),
            ]);

            res.json({ result: null, message: "User deleted successfully", meta: null });
        } catch (error) {
            console.error("[UserController] deleteUser:", error);
            next(error);
        }
    };
}

module.exports = new UserController();