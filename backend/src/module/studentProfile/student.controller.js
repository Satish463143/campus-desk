const { Role, Status } = require("../../config/constant.config")
const studentService = require("./student.service")
const bcrypt = require("bcryptjs")
const { getCache, setCache, clearCache } = require("../../utils/redisCache")

class StudentController {
    // -----------------------------------------------------------------------
    // Private helper — validates that an ID is provided and the student exists
    // -----------------------------------------------------------------------
    #validate = async (id) => {
        if (!id) throw { status: 400, message: "Student id is required" }
        const student = await studentService.getStudentById(id)
        if (!student) throw { status: 404, message: "Student not found" }
        return student
    }


    // -----------------------------------------------------------------------
    // LIST  —  GET /students?page=1&limit=10&search=name
    // -----------------------------------------------------------------------
    listStudents = async (req, res, next) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 10, 100) // cap at 100
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const skip = (page - 1) * limit
            const search = req.query.search?.trim() || ""

            const cacheKey = `students_list_p${page}_l${limit}_s${search}_school${req.authUser.schoolId}`
            const cachedData = await getCache(cacheKey)

            if (cachedData) {
                return res.json({
                    result: cachedData.data,
                    message: "Student list fetched (cached)",
                    meta: { currentPage: page, limit, total: cachedData.count }
                })
            }

            // FIX: Build a proper Prisma where filter (was MongoDB $regex before)
            // FIX: Scope list to the authenticated user's school only
            const filter = {
                schoolId: req.authUser.schoolId,
                ...(search && {
                    user: { name: { contains: search, mode: "insensitive" } }
                })
            }

            // FIX: Pass filter, limit, skip as separate args (was passing a single object)
            const { data, count } = await studentService.listStudents(filter, limit, skip)

            await setCache(cacheKey, { data, count }, 30) // 30s TTL so enrollment data stays fresh

            return res.json({
                result: data,
                message: "Student list fetched",
                meta: { currentPage: page, limit, total: count }
            })
        } catch (exception) {
            console.error("listStudents controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // GET BY ID  —  GET /students/:id
    // -----------------------------------------------------------------------
    getStudentById = async (req, res, next) => {
        try {
            const student = await this.#validate(req.params.id)
            return res.json({
                message: "Student fetched successfully",
                result: student,
                meta: null
            })
        } catch (exception) {
            console.error("getStudentById controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // UPDATE (admin/principal)  —  PUT /students/:id
    // -----------------------------------------------------------------------
    updateStudentProfile = async (req, res, next) => {
        try {
            const data = req.body
            const student = await this.#validate(req.params.id)

            const { studentUser, studentProfile } = await studentService.updateStudentProfile(student, data)

            await clearCache("students_list_*")

            return res.json({
                message: "Student updated successfully",
                result: { studentUser, studentProfile },
                meta: null
            })
        } catch (exception) {
            console.error("updateStudentProfile controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // SELF-UPDATE (student)  —  PATCH /students/:id/self
    // -----------------------------------------------------------------------
    updateStudentSelfProfile = async (req, res, next) => {
        try {
            const data = req.body
            const student = await this.#validate(req.params.id)

            // FIX: Read from req.body (data), NOT from the fetched DB record (student)
            // FIX: Pass student.user.id + student.id so the service knows what to update
            const { studentUser, studentProfile } = await studentService.updateStudentProfile(
                {
                    id: student.user.id,        // ← required for WHERE clause
                    email: data.email,
                    profileImage: data.profileImage,
                    address: data.address,
                },
                {
                    id: student.id,             // ← required for WHERE clause
                    bloodGroup: data.bloodGroup,                    
                }
            )

            await clearCache("students_list_*")

            return res.json({
                message: "Profile updated successfully",
                result: { studentUser, studentProfile },
                meta: null
            })
        } catch (exception) {
            console.error("updateStudentSelfProfile controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // DELETE  —  DELETE /students/:id
    // -----------------------------------------------------------------------
    deleteStudentProfile = async (req, res, next) => {
        try {
            const student = await this.#validate(req.params.id)
            const deleted = await studentService.deleteStudentProfile(student)
            await clearCache("students_list_*")
            return res.json({
                message: "Student deleted successfully",
                result: deleted,
                meta: null
            })
        } catch (exception) {
            console.error("deleteStudentProfile controller error:", exception)
            next(exception)
        }
    }
}

module.exports = new StudentController()