const schoolRegisterService = require("./schoolRegister.service");
const { Role } = require("../../config/constant.config");
const { getCache, setCache, clearCache } = require("../../utils/redisCache");
const bcrypt = require("bcryptjs");

class SchoolController {
    
    createschool = async (req, res, next) => {
        try {
            const data = req.body;

            const { school, principal } =
            await schoolRegisterService.createSchoolAndPrincipal(
                {
                schoolName: data.schoolName,
                address: data.address,
                },
                {
                name: data.principal.name,
                email: data.principal.email,
                phone: data.principal.phone,
                password: data.password ? bcrypt.hashSync(data.password, 10) : "",
                role: Role.PRINCIPAL,
                address: data.address,
                }
            );

            await clearCache("schools_list_*");

            res.json({
            meta: null,
            message: "School and Principal account created successfully",
            result: { school, principal },
            });

        } catch (exception) {
            console.error("Error in createschool controller:", exception);
            next(exception);
        }
    };

    listSchools = async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const search = req.query.search || "";

            const cacheKey = `schools_list_p${page}_l${limit}_s${search}`;
            const cachedData = await getCache(cacheKey);

            if (cachedData) {
                return res.json({
                    result: cachedData.data,
                    message: "School list fetched (cached)",
                    meta: {
                        currentPage: page,
                        limit: limit,
                        total: cachedData.count
                    }
                });
            }

            const { data, count } = await schoolRegisterService.listSchools({ search, limit, skip });

            // Cache for 10 minutes
            await setCache(cacheKey, { data, count }, 600);

            res.json({
                result: data,
                message: "School list fetched",
                meta: {
                    currentPage: page,
                    limit: limit,
                    total: count
                }
            });

        } catch (exception) {
            console.error("listing school controller error", exception);
            next(exception);
        }
    };

    #validate = async (id) => {
        if (!id) {
            throw { status: 400, message: "School id is required" };
        }
        const school = await schoolRegisterService.getSchoolById(id);
        if (!school) {
            throw { status: 404, message: "School not found" };
        }
        return school;
    };

    getSchool = async (req, res, next) => {
        try {            
            let schoolId;
            if (req.authUser.role === Role.SUPER_ADMIN) {
                schoolId = req.params.id;
            } else if (req.authUser.role === Role.PRINCIPAL) {
                schoolId = req.authUser.schoolId;
            } else {
                throw { status: 403, message: "Unauthorized access" };
            }
            const school = await this.#validate(schoolId);
            res.json({
                message: "School fetched successfully",
                result: school,
                meta: null
            });

        } catch (exception) {
            console.error("get school controller error", exception);
            next(exception);
        }
    };

    updateSchoolProfile = async (req, res, next) => {
        try {
            const data = req.body;
            const schoolId = req.authUser.schoolId;
            
            await this.#validate(schoolId);
            const updatedSchool = await schoolRegisterService.updateSchoolProfile(schoolId, data);
            
            // Invalidate caches
            await clearCache(`school_${schoolId}`);
            await clearCache("schools_list_*");

            res.json({
                message: "School profile updated successfully",
                result: updatedSchool,
                meta: null
            });

        } catch (exception) {
            console.error("update school profile controller error", exception);
            next(exception);
        }
    };

    updateSchoolStatus = async (req, res, next) => {
        try {
            const data = req.body;
            const id = req.params.id;

            await this.#validate(id);
            const updatedSchool = await schoolRegisterService.updateSchoolStatus(id, data);

            // Invalidate caches
            await clearCache(`school_${id}`);
            await clearCache("schools_list_*");

            res.json({
                message: "School status updated successfully",
                result: updatedSchool,
                meta: null
            });

        } catch (exception) {
            console.error("update school status controller error", exception);
            next(exception);
        }
    };

    deleteSchool = async (req, res, next) => {
        try {
            const id = req.params.id;
            const result = await schoolRegisterService.deleteSchool(id);

            // Bust list cache so the deletion is reflected immediately
            await clearCache(`school_${id}`);
            await clearCache("schools_list_*");

            res.json({
                message: "School deleted successfully",
                result,
                meta: null
            });
        } catch (exception) {
            console.error("delete school controller error", exception);
            next(exception);
        }
    };
}

module.exports = new SchoolController();