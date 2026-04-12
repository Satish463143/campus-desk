const { Role } = require("../config/constant.config");

const schoolStatusCheck = (blockedStatuses = []) => {
  return (req, res, next) => {
    try {
      // Bypass Super admin 
      if (req.authUser.role === Role.SUPER_ADMIN) return next();

      const school = req.school;

      if (!school) {
        return next({
          status: 404,
          message: "School not found"
        });
      }

      if (blockedStatuses.includes(school.schoolStatus)) {
        return next({
          status: 403,
          message: `School is currently ${school.schoolStatus}`
        });
      }

      next();
    } catch (error) {
      next({
        status: 500,
        message: "School status validation failed"
      });
    }
  };
};

module.exports = schoolStatusCheck;
