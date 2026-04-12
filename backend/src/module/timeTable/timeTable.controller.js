const timetableService = require("./timeTable.service");
const { getCache, setCache } = require("../../utils/redisCache");

class TimetableController {
    
    _buildResponse(result, message = "Operation successful", statusCode = 200) {
        return {
            meta: {
                success: true,
                status: statusCode
            },
            message: message,
            result: result
        };
    }
    
    bulkCreateTimetable = ()=>{

    }

    createTimetable = async (req, res, next) => {
        try {
            const schoolId = req.authUser.schoolId;
            const { academicYearId } = req.query; // Assuming it's passed or available from context
            
            // if we need to reliably get the current active academic year, ideally we fetch it beforehand or take it in req.body. Let's get it from req.body or query. 
            // In a real scenario we could fetch active academic year or we demand it. For now let's enforce passing it from req.body or query.
            const targetAcademicYearId = req.body.academicYearId || req.query.academicYearId;
            if (!targetAcademicYearId) {
                return res.status(400).json({ success: false, message: "academicYearId is required in body or query" });
            }

            const data = req.body;
            const result = await timetableService.createTimetable(schoolId, targetAcademicYearId, data);
            
            res.status(201).json(this._buildResponse(result, "Timetable entry created successfully", 201));
        } catch (error) {
            next(error);
        }
    }

    getTimetables = async (req, res, next) => {
        try {
            const schoolId = req.authUser.schoolId;
            const { academicYearId } = req.query;
            if (!academicYearId) {
                return res.status(400).json({ success: false, message: "academicYearId query param is required" });
            }

            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const search = req.query.search || "";

            const cacheKey = `timetables_list_s${schoolId}_a${academicYearId}_p${page}_l${limit}_s${search}`;
            const cachedData = await getCache(cacheKey);

            if (cachedData) {
                return res.json({
                    result: cachedData.data,
                    message: "Timetable list fetched (cached)",
                    meta: {
                        currentPage: page,
                        limit: limit,
                        total: cachedData.count
                    }
                });
            }

            const { data, count } = await timetableService.getTimetables({ schoolId, academicYearId, skip, limit, search });

            await setCache(cacheKey, { data, count }, 600);

            res.json({
                result: data,
                message: "Timetable list fetched",
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

    getTimetableById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const schoolId = req.authUser.schoolId;
            const result = await timetableService.getTimetableById({ id, schoolId });
            res.status(200).json(this._buildResponse(result, "Timetable fetched successfully", 200));
        } catch (error) {
            next(error);
        }
    }

    updateTimetable = async (req, res, next) => {
        try {
            const { id } = req.params;
            const schoolId = req.authUser.schoolId;
            const data = req.body;
            const result = await timetableService.updateTimetable({ id, schoolId, data });
            res.status(200).json(this._buildResponse(result, "Timetable entry updated successfully", 200));
        } catch (error) {
            next(error);
        }
    }

    deleteTimetable = async (req, res, next) => {
        try {
            const { id } = req.params;
            const schoolId = req.authUser.schoolId;
            const result = await timetableService.deleteTimetable({ id, schoolId });
            res.status(200).json(this._buildResponse(null, result.message, 200));
        } catch (error) {
            next(error);
        }
    }

    getSectionTimetable = async (req, res, next) => {
        try {
            const { sectionId } = req.params;
            const schoolId = req.authUser.schoolId;
            const { academicYearId } = req.query;
            if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required" });

            const result = await timetableService.getSectionTimetable({ schoolId, academicYearId, sectionId });
            res.status(200).json(this._buildResponse(result, "Section timetable fetched successfully", 200));
        } catch (error) {
            next(error);
        }
    }

    getTeacherTimetable = async (req, res, next) => {
        try {
            const { teacherId } = req.params;
            const schoolId = req.authUser.schoolId;
            const { academicYearId } = req.query;
            if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required" });

            const result = await timetableService.getTeacherTimetable({ schoolId, academicYearId, teacherId });
            res.status(200).json(this._buildResponse(result, "Teacher timetable fetched successfully", 200));
        } catch (error) {
            next(error);
        }
    }

    getDaySchedule = async (req, res, next) => {
        try {
            const { dayOfWeek } = req.params;
            const schoolId = req.authUser.schoolId;
            const { academicYearId } = req.query;
            if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required" });

            const result = await timetableService.getDaySchedule({ schoolId, academicYearId, dayOfWeek: dayOfWeek.toUpperCase() });
            res.status(200).json(this._buildResponse(result, "Day schedule fetched successfully", 200));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TimetableController();
