const { Role } = require("../config/constant.config");

/**
 * Middleware: verify the authenticated user (req.authUser) is allowed
 * to manage the target user (req.targetUser).
 *
 * Permission matrix:
 *   SUPER_ADMIN  → can manage anyone
 *   PRINCIPAL    → can manage ADMIN_STAFF, ACCOUNTANT  (same school)
 *   ADMIN_STAFF  → can manage ACCOUNTANT              (same school)
 *
 * Also enforces same-school isolation (multi-tenant safety).
 */
const canManageUser = (req, res, next) => {
    const loggedUser       = req.authUser;   // set by loginCheck middleware
    const targetUser       = req.targetUser; // set by loadTargetUser middleware

    if (!loggedUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
    }

    const loggedRole  = loggedUser.role;
    const targetRole  = targetUser.role;
    const sameSchool  = loggedUser.schoolId === targetUser.schoolId;

    // Super admin can manage anyone regardless of school
    if (loggedRole === Role.SUPER_ADMIN) {
        return next();
    }

    // All other roles must belong to the same school
    if (!sameSchool) {
        return res.status(403).json({ message: "Not authorized to manage users from a different school" });
    }

    // Principal can manage admin_staff & accountant
    if (
        loggedRole === Role.PRINCIPAL &&
        [Role.ADMIN_STAFF, Role.ACCOUNTANT].includes(targetRole)
    ) {
        return next();
    }

    // Admin staff can only manage accountant
    if (
        loggedRole === Role.ADMIN_STAFF &&
        targetRole === Role.ACCOUNTANT
    ) {
        return next();
    }

    return res.status(403).json({ message: "Not authorized to manage this user" });
};

module.exports = { canManageUser };