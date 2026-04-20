const admissionService = require("./admission.service")
class AdmissionController {
    create = async (req, res, next) => {
        try {
            // After persistAllToS3 runs, req.files contains the S3 results keyed by field name.
            // We extract profileImage and documents URLs and merge them into the body
            // so the service receives everything in one clean data object.
            const profileImage = req.files?.profileImage?.[0]?.location ?? null
            const documents   = (req.files?.documents ?? []).map(f => ({
                url:         f.location,   // S3 URL set by persistAllToS3
                key:         f.key,        // S3 object key
                originalName: f.originalname,
                mimeType:    f.mimetype,
            }))

            const body = {
                ...req.body,
                profileImage,  // single S3 URL or null
                documents,     // array of { url, key, originalName, mimeType }
            }

            const result = await admissionService.create(body, req.authUser.schoolId)
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
                                surname:   row.surname   || "Unknown",
                                email:     row.email     || `student_${Date.now()}@noreply.local`,
                                phone:     row.phone     || "0000000000",
                                gender:    row.gender    ? row.gender.toLowerCase() : "other",
                                dateOfBirth: row.dateOfBirth || null,
                                className:   row.className  || "",
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
                .on('error', (err) => next(err));

        } catch (exception) {
            console.error("bulk upload error:", exception);
            next(exception);
        }
    }
}

module.exports = new AdmissionController()
