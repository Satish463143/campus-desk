const periodService = require("./periods.service");
const { getCache, setCache } = require("../../utils/redisCache");

class PeriodController {
    createPeriod = async (req, res, next) => {
        try {
            const schoolId = req.authUser.schoolId;
            const data = { ...req.body, schoolId };
            const response = await periodService.createPeriod(data);
            res.json({
                message: "Period created successfully",
                result: response,
                meta:null
            });
        } catch (error) {
            next(error);
        }
    }

    getPeriods = async (req, res, next) => {
        try {
            const schoolId = req.authUser.schoolId;
            const { academicYearId } = req.query;
            if (!academicYearId) {
                return res.status(400).json({ success: false, message: "academicYearId is required" });
            }

            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const search = req.query.search || "";

            const cacheKey = `periods_list_s${schoolId}_a${academicYearId}_p${page}_l${limit}_s${search}`;
            const cachedData = await getCache(cacheKey);

            if (cachedData) {
                return res.json({
                    result: cachedData.data,
                    message: "Periods list fetched (cached)",
                    meta: {
                        currentPage: page,
                        limit: limit,
                        total: cachedData.count
                    }
                });
            }

            const { data, count } = await periodService.getPeriods({ schoolId, academicYearId, skip, limit, search });

            await setCache(cacheKey, { data, count }, 600);

            res.json({
                message: "Periods list fetched",
                result: data,
                meta: {
                    currentPage: page,
                    limit: limit,
                    total: count
                }
            });
        } catch (error) {
            next(error);
        }
    }

    getPeriodById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const schoolId = req.authUser.schoolId;
            const response = await periodService.getPeriodById({ id, schoolId });
            res.json({
                message: "Period fetched successfully",
                result: response,
                meta:null
            });
        } catch (error) {
            next(error);
        }
    }

    updatePeriod = async (req, res, next) => {
        try {
            const { id } = req.params;
            const schoolId = req.authUser.schoolId;
            const data = req.body;
            const response = await periodService.updatePeriod({ id, schoolId, data });
            res.json({
                message: "Period updated successfully",
                result: response,
                meta:null
            });
        } catch (error) {
            next(error);
        }
    }

    deletePeriod = async (req, res, next) => {
        try {
            const { id } = req.params;
            const schoolId = req.authUser.schoolId;
            const response = await periodService.deletePeriod({ id, schoolId });
            res.json({
                message: "Period deleted successfully",
                result: response,
                meta:null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PeriodController();
