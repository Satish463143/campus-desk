const { Role } = require("../config/constant.config");
const { getCache, setCache } = require("../utils/redisCache");
const prisma = require("../config/db.config");

const CACHE_TTL = 300; // 5 minutes

/**
 * Middleware: load the target user from DB (or Redis cache).
 * Sets req.targetUser for downstream handlers (canManageUser, controller).
 *
 * Cache key: user:{id}
 */
const loadTargetUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "User id is required" });

        const cacheKey = `user:${id}`;

        // Attempt cache hit first
        const cached = await getCache(cacheKey);
        if (cached) {
            req.targetUser = cached;
            return next();
        }

        // Cache miss — query DB
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Populate cache for subsequent requests
        await setCache(cacheKey, user, CACHE_TTL);

        req.targetUser = user;
        next();
    } catch (error) {
        console.error("[loadTargetUser]", error);
        next(error);
    }
};

module.exports = { loadTargetUser };