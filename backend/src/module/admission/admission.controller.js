const admissionService = require("./admission.service")
const { clearCache } = require("../../utils/redisCache")
const prisma = require("../../config/db.config")

class AdmissionController {
    create = async (req, res, next) => {
        try {
            const result = await admissionService.create(req.body, req.authUser.schoolId)
            return res.status(201).json({
                result,
                message: "Admission application processed successfully",
                meta: null,
            })
        } catch (exception) {
            console.error("create admission error:", exception)
            next(exception)
        }
    }

    searchParentByPhone = async (req, res, next) => {
        try {
            const { phone } = req.query;
            if (!phone || String(phone).trim().length < 2) {
                return res.json({ result: [], message: "Query too short", meta: null });
            }
            const q = String(phone).trim();
            // Match phone starting with the query OR containing it (handles country-code prefixes)
            const users = await prisma.user.findMany({
                where: {
                    schoolId: req.authUser.schoolId,
                    role: "parent",
                    phone: { contains: q }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    parentProfile: {
                        select: {
                            id: true,
                            relationType: true,
                            occupation: true,
                            // Pull rich details from the most recent linked student's JSON blobs
                            students: {
                                select: {
                                    father: true,
                                    mother: true,
                                    guardian: true,
                                },
                                take: 1,
                                orderBy: { createdAt: "desc" }
                            }
                        }
                    }
                },
                take: 10,
                orderBy: { createdAt: "desc" }
            });
            return res.json({ result: users, message: "Parents found", meta: null });
        } catch (exception) {
            console.error("searchParentByPhone error:", exception);
            next(exception);
        }
    }

    uploadDocs = async (req, res, next) => {
        try {
            const urls = req.body.files || [];
            return res.json({
                result: urls,
                message: "Documents uploaded successfully",
                meta: null
            });
        } catch (err) {
            next(err);
        }
    }

    bulkUpload = async (req, res, next) => {
        try {
            if (!req.file) throw { status: 400, message: "No file uploaded" };
            
            const results = [];
            const csv = require('csv-parser');
            const { Readable } = require('stream');

            const stream = Readable.from(req.file.buffer);
            
            stream.pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    let successCount = 0;
                    let errorCount = 0;
                    const errors = [];

                    for (const row of results) {
                        try {
                            const data = {
                                firstName: row.firstName || "Unknown",
                                surname: row.surname || "Unknown",
                                email: row.email || `student_${Date.now()}@test.com`,
                                phone: row.phone || "0000000000",
                                gender: row.gender ? row.gender.toLowerCase() : "other",
                                dateOfBirth: row.dateOfBirth || null,
                                className: row.className || "",
                                fees: {}
                            };
                            await admissionService.create(data, req.authUser.schoolId);
                            successCount++;
                        } catch (err) {
                            errorCount++;
                            errors.push({ row, error: err.message });
                        }
                    }

                    return res.json({
                        result: { successCount, errorCount, errors },
                        message: "Bulk upload processed",
                        meta: null
                    });
                })
                .on('error', (err) => {
                    next(err);
                });
        } catch (exception) {
            console.error("bulk upload error:", exception);
            next(exception);
        }
    }
}

module.exports = new AdmissionController()