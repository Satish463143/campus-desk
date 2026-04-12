
require("dotenv").config();
const jwt = require("jsonwebtoken")
const userService = require("../module/user/user.service");
const prisma = require("../config/db.config");

const loginCheck = async (req, res, next) => {
    try {
        let token = req.headers['authorization'] || null;
        if (!token) {
            throw { status: 401, message: "Unauthorized access: Token not provided" };
        }

        token = token.split(" ").pop();

        const data = jwt.verify(token, process.env.JWT_SECRET);
        if(data.hasOwnProperty('type')){
            throw{status:403, message: "Main Token is required"}
        }

        const user = await userService.getSingleUserByFilter({
            id: data.sub
        });

        if (!user) {
            throw { status: 404, message: "User does not exist" };
        }

        let studentProfileId = null;
        let parentProfileId = null;

        if (user.role === "student") {
            const sp = await prisma.studentProfile.findFirst({ where: { userId: user.id } });
            studentProfileId = sp?.id ?? null;
        }
        if (user.role === "parent") {
            const pp = await prisma.parentProfile.findFirst({ where: { userId: user.id } });
            parentProfileId = pp?.id ?? null;
        }

        req.authUser = {
            id: user.id,
            name: user.name,
            role: user.role,
            status: user.status,
            email:user.email,
            schoolId:user.schoolId,
            studentProfileId,
            parentProfileId,
        };
        next();
    } catch (exception) {
        next({ status: exception.status || 401, message: exception.message || "Unauthorized" });
    }
};

module.exports = loginCheck;
