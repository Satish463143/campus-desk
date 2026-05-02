const bcrypt = require("bcryptjs");
const userService = require("../user/user.service");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db.config");
const { Status } = require("../../config/constant.config");
require("dotenv").config();

class AuthController {
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const user = await userService.getSingleUserByFilter({
                email: email
            })

            if (user.status === Status.INACTIVE) {
                throw { status: 401, message: "User is inactive" }
            }

            if (bcrypt.compareSync(password, user.password)) {
                const token = jwt.sign({
                    sub: user.id,
                }, process.env.JWT_SECRET, {
                    expiresIn: "1d"
                })
                const refreshToken = jwt.sign({
                    sub: user.id,
                    type: "refresh"
                }, process.env.JWT_SECRET, {
                    expiresIn: "7d"
                })

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date()
                    }
                })

                let studentProfileId = null;
                let parentProfileId = null;
                let teacherProfileId = null;
                if (user.role === "student") {
                    const sp = await prisma.studentProfile.findFirst({ where: { userId: user.id } });
                    studentProfileId = sp?.id ?? null;
                }
                if (user.role === "parent") {
                    const pp = await prisma.parentProfile.findFirst({ where: { userId: user.id } });
                    parentProfileId = pp?.id ?? null;
                }
                if (user.role === "teacher") {
                    const tp = await prisma.teacherProfile.findFirst({ where: { userId: user.id } });
                    teacherProfileId = tp?.id ?? null;
                }

                res.json({
                    result: {
                        userDetails: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            schoolId: user.schoolId,
                            studentProfileId,
                            parentProfileId,
                            teacherProfileId,
                        },
                        token: { token, refreshToken }
                    },
                    message: "User logged in successfully",
                    meta: null
                })
            } else {
                throw { status: 401, message: "Invalid Credentials" }
            }
        } catch (error) {
            console.log("login error", error)
            next(error)
        }
    }
    getLoggedInUser = async (req, res, next) => {
        try {
            res.json({
                result: req.authUser,
                message: "User Profile",
                meta: null
            })
        } catch (error) {
            console.log("getLoggedInUser error", error)
            next(error)
        }
    }
    refreshToken = async (req, res, next) => {
        try {
            const oldRefreshToken = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);
            const user = await userService.getSingleUserByFilter({ id: decoded.sub });
            const token = jwt.sign({
                sub: user.id,
            }, process.env.JWT_SECRET, {
                expiresIn: "1d"
            })
            const refreshToken = jwt.sign({
                sub: user.id,
                type: "refresh"
            }, process.env.JWT_SECRET, {
                expiresIn: "7d"
            })
            let studentProfileId = null;
            let parentProfileId = null;
            let teacherProfileId = null;
            if (user.role === "student") {
                const sp = await prisma.studentProfile.findFirst({ where: { userId: user.id } });
                studentProfileId = sp?.id ?? null;
            }
            if (user.role === "parent") {
                const pp = await prisma.parentProfile.findFirst({ where: { userId: user.id } });
                parentProfileId = pp?.id ?? null;
            }
            if (user.role === "teacher") {
                const tp = await prisma.teacherProfile.findFirst({ where: { userId: user.id } });
                teacherProfileId = tp?.id ?? null;
            }

            res.json({
                result: {
                    userDetails: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        schoolId: user.schoolId,
                        studentProfileId,
                        parentProfileId,
                        teacherProfileId,
                    },
                    token: { token, refreshToken }
                },
                message: "User logged in successfully",
                meta: null
            })
        } catch (error) {
            console.log("refreshToken error", error)
            next(error)
        }
    }
    logout = async (req, res, next) => {
        try {
            // Logout logic depends on how tokens are managed. 
            // If stateless, just return success. If stored in DB, clear them.
            res.json({
                result: null,
                message: "User logged out successfully",
                meta: null
            })

        } catch (error) {
            console.log("logout error", error)
            next(error)
        }
    }
    changePassword = async (req, res, next) => {
        try {

        } catch (error) {

        }
    }


}
module.exports = new AuthController();