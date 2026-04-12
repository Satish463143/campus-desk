const { getCache, setCache, clearCache } = require("../../utils/redisCache")
const parentService = require("./parent.service")
const bcrypt = require("bcryptjs")

class ParentController {
    // -----------------------------------------------------------------------
    // Private helper — validates that an ID is provided and the parent exists
    // -----------------------------------------------------------------------
    #validate = async (id) => {
        if (!id) throw { status: 400, message: "Parent id is required" }
        const parent = await parentService.getParentById(id)
        if (!parent) throw { status: 404, message: "Parent not found" }
        return parent
    }

    // -----------------------------------------------------------------------
    // LIST  —  GET /parents?page=1&limit=10&search=name
    // -----------------------------------------------------------------------
    listParents = async (req, res, next) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 10, 100)
            const page  = Math.max(parseInt(req.query.page)  || 1,  1)
            const skip  = (page - 1) * limit
            const search = req.query.search?.trim() || ""

            const cacheKey = `parents_list_p${page}_l${limit}_s${search}_school${req.authUser.schoolId}`
            const cachedData = await getCache(cacheKey)

            if (cachedData) {
                return res.json({
                    result: cachedData.data,
                    message: "Parent list fetched (cached)",
                    meta: { currentPage: page, limit, total: cachedData.count }
                })
            }

            const filter = {
                schoolId: req.authUser.schoolId,
                ...(search && {
                    user: { name: { contains: search, mode: "insensitive" } }
                })
            }

            const { data, count } = await parentService.listParents(filter, limit, skip)
            await setCache(cacheKey, { data, count }, 600)

            return res.json({
                result: data,
                message: "Parent list fetched",
                meta: { currentPage: page, limit, total: count }
            })
        } catch (exception) {
            console.error("listParents controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // GET BY ID  —  GET /parents/:id
    // -----------------------------------------------------------------------
    getParentById = async (req, res, next) => {
        try {
            const parent = await this.#validate(req.params.id)
            return res.json({
                message: "Parent fetched successfully",
                result: parent,
                meta: null
            })
        } catch (exception) {
            console.error("getParentById controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // UPDATE (admin/principal)  —  PUT /parents/:id
    // -----------------------------------------------------------------------
    updateParentProfile = async (req, res, next) => {
        try {
            const data   = req.body
            const parent = await this.#validate(req.params.id)

            const password = data.password
                ? await bcrypt.hash(data.password, 10)
                : undefined

            const { parentUser, parentProfile } = await parentService.updateParentProfile(
                {
                    id: parent.user.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    ...(password && { password }),
                    address: data.address,
                    profileImage: data.profileImage,
                    status: data.status,
                },
                {
                    id: parent.id,
                    relationType: data.relationType,
                    occupation: data.occupation,
                    emergencyContact: data.emergencyContact,                    
                }
            )

            await clearCache("parents_list_*")

            return res.json({
                message: "Parent updated successfully",
                result: { parentUser, parentProfile },
                meta: null
            })
        } catch (exception) {
            console.error("updateParentProfile controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // SELF-UPDATE (parent)  —  PUT /parents/parent-self-update/:id
    // -----------------------------------------------------------------------
    updateParentSelfProfile = async (req, res, next) => {
        try {
            const data   = req.body
            const parent = await this.#validate(req.params.id)

            const { parentUser, parentProfile } = await parentService.updateParentProfile(
                {
                    id: parent.user.id,
                    profileImage: data.profileImage,
                    address: data.address,
                },
                {
                    id: parent.id,          // ← required for WHERE clause
                    occupation: data.occupation,
                    emergencyContact: data.emergencyContact,                    
                }
            )

            await clearCache("parents_list_*")

            return res.json({
                message: "Profile updated successfully",
                result: { parentUser, parentProfile },
                meta: null
            })
        } catch (exception) {
            console.error("updateParentSelfProfile controller error:", exception)
            next(exception)
        }
    }

    // -----------------------------------------------------------------------
    // DELETE  —  DELETE /parents/:id
    // -----------------------------------------------------------------------
    deleteParentProfile = async (req, res, next) => {
        try {
            const parent  = await this.#validate(req.params.id)
            const deleted = await parentService.deleteParentProfile(parent)
            await clearCache("parents_list_*")
            return res.json({
                message: "Parent deleted successfully",
                result: deleted,
                meta: null
            })
        } catch (exception) {
            console.error("deleteParentProfile controller error:", exception)
            next(exception)
        }
    }
}

module.exports = new ParentController()
