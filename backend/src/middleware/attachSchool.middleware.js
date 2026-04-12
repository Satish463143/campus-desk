const prisma = require("../config/db.config");

const attachSchool = async (req, res, next) => {
  try {
    if (!req.authUser.schoolId) return next(); // super admin

    const school = await prisma.school.findUnique({
        where: { id: req.authUser.schoolId }
    });

    if (!school) {
      return next({ status: 404, message: "School not found" });
    }

    req.school = school;

    next();
  } catch (err) {
    next({ status: 500, message: "School load failed" });
  }
};
module.exports = attachSchool;