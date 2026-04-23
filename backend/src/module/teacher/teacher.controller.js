const { Role, Status } = require("../../config/constant.config")
const teacherService = require("./teacher.service")
const bcrypt = require("bcryptjs")
const { getCache, setCache, clearCache } = require("../../utils/redisCache")

class TeacherController {
    // -----------------------------------------------------------------------
    // Private helper — validates that an ID is provided and the teacher exists
    // -----------------------------------------------------------------------
    #validate = async (id) => {
        if (!id) throw { status: 400, message: "Teacher id is required" }
        const teacher = await teacherService.getTeacherById(id)
        if (!teacher) throw { status: 404, message: "Teacher not found" }
        return teacher
    }

    // -----------------------------------------------------------------------
    // CREATE  —  POST /teachers
    // -----------------------------------------------------------------------
    createTeacherProfile = async (req, res, next) => {
        try {
            const data = req.body

            // Hash password
            const hashedPw = await bcrypt.hash(data.password, 10)

            // Create teacher
            const result = await teacherService.createTeacher(
                // teacher user
                {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    password: hashedPw,
                    profileImage: data.profileImage,
                    address: data.address,
                    schoolId: req.authUser.schoolId,
                    role: Role.TEACHER,
                    status: Status.ACTIVE,
                },
                // teacher profile
                {
                    employeeId: data.employeeId,
                    qualification: data.qualification,
                    experienceYears: data.experienceYears !== undefined && data.experienceYears !== "" && data.experienceYears !== null ? Number(data.experienceYears) : undefined,
                    joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : undefined,
                    salary: data.salary !== undefined && data.salary !== "" && data.salary !== null ? Number(data.salary) : undefined,                   
                    department: data.department,
                    designation: data.designation,
                    schoolId: req.authUser.schoolId,
                }
            )

            await clearCache("teachers_list_*")

            return res.status(201).json({
                message: "Teacher created successfully",
                result,
                meta: null,
            })
        } catch (exception) {
            console.error("Exception in createTeacherProfile:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // LIST  —  GET /teachers?page=1&limit=10&search=name
    // -----------------------------------------------------------------------
    listTeachers = async (req, res, next) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 10, 100) // cap at 100
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const skip = (page - 1) * limit
            const search = req.query.search?.trim() || ""
            const status = req.query.status?.trim() || ""

            const cacheKey = `teachers_list_p${page}_l${limit}_s${search}_st${status}_school${req.authUser.schoolId}`
            const cachedData = await getCache(cacheKey)

            if (cachedData) {
                return res.json({
                    result: cachedData.data,
                    message: "Teacher list fetched (cached)",
                    meta: { currentPage: page, limit, total: cachedData.count }
                })
            }

            const filter = {
                schoolId: req.authUser.schoolId,
            }
            
            if (search || status) {
                filter.user = {}
                if (search) filter.user.name = { contains: search, mode: "insensitive" }
                if (status) filter.user.status = status
            }

            const { data, count } = await teacherService.listTeachers(filter, limit, skip)

            await setCache(cacheKey, { data, count }, 600) // cache for 10 min

            return res.json({
                result: data,
                message: "Teacher list fetched",
                meta: { currentPage: page, limit, total: count }
            })
        } catch (exception) {
            console.error("listTeachers controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // GET BY ID  —  GET /teachers/:id
    // -----------------------------------------------------------------------
    getTeacherById = async (req, res, next) => {
        try {
            const teacher = await this.#validate(req.params.id)
            return res.json({
                message: "Teacher fetched successfully",
                result: teacher,
                meta: null
            })
        } catch (exception) {
            console.error("getTeacherById controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // UPDATE (admin/principal)  —  PUT /teachers/:id
    // -----------------------------------------------------------------------
    updateTeacherProfile = async (req, res, next) => {
        try {
            const data = req.body
            const teacher = await this.#validate(req.params.id)

            // FIX: Only hash password if explicitly provided in the request
            const password = data.password
                ? await bcrypt.hash(data.password, 10)
                : undefined

            const { teacherUser, teacherProfile } = await teacherService.updateTeacherProfile(
                {
                    id: teacher.user.id,        // ← required for WHERE clause
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    ...(password && { password }),
                    profileImage: data.profileImage,
                    status: data.status,
                    address: data.address,
                },
                {
                    id: teacher.id,             // ← required for WHERE clause
                    employeeId: data.employeeId,
                    qualification: data.qualification,
                    experienceYears: data.experienceYears !== undefined && data.experienceYears !== "" && data.experienceYears !== null ? Number(data.experienceYears) : undefined,
                    joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : undefined,
                    salary: data.salary !== undefined && data.salary !== "" && data.salary !== null ? Number(data.salary) : undefined,
                    department: data.department,
                    designation: data.designation,
                    
                }
            )

            await clearCache("teachers_list_*")

            return res.json({
                message: "Teacher updated successfully",
                result: { teacherUser, teacherProfile },
                meta: null
            })
        } catch (exception) {
            console.error("updateTeacherProfile controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // SELF-UPDATE (teacher)  —  PATCH /teachers/:id/self
    // -----------------------------------------------------------------------
    updateTeacherSelfProfile = async (req, res, next) => {
        try {
            const data = req.body
            const teacher = await this.#validate(req.params.id)

            // Teacher can only update phone, profileImage, qualification, experienceYears, address
            // Email is excluded — login email should only be changed by admin
            const { teacherUser, teacherProfile } = await teacherService.updateTeacherProfile(
                {
                    id: teacher.user.id,        // ← required for WHERE clause
                    phone: data.phone,
                    profileImage: data.profileImage,
                    address: data.address,
                },
                {
                    id: teacher.id,             // ← required for WHERE clause
                    qualification: data.qualification,
                    experienceYears: data.experienceYears !== undefined && data.experienceYears !== "" && data.experienceYears !== null ? Number(data.experienceYears) : undefined,                    
                }
            )

            await clearCache("teachers_list_*")

            return res.json({
                message: "Profile updated successfully",
                result: { teacherUser, teacherProfile },
                meta: null
            })
        } catch (exception) {
            console.error("updateTeacherSelfProfile controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // DELETE  —  DELETE /teachers/:id
    // -----------------------------------------------------------------------
    deleteTeacherProfile = async (req, res, next) => {
        try {
            const teacher = await this.#validate(req.params.id)
            const deleted = await teacherService.deleteTeacherProfile(teacher)
            await clearCache("teachers_list_*")
            return res.json({
                message: "Teacher deleted successfully",
                result: deleted,
                meta: null
            })
        } catch (exception) {
            console.error("deleteTeacherProfile controller error:", exception)
            next(exception)
        }
    }
}

module.exports = new TeacherController()