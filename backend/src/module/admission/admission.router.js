const { Role, FileFilterType } = require("../../config/constant.config")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const attachSchool = require("../../middleware/attachSchool.middleware")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const { uploadMixed, persistAllToS3 } = require("../../middleware/aws.middlware")
const admissionController = require("./admission.controller")
const { createAdmissionDTO } = require("./admission.request")
const router = require("express").Router()

const CAN_WRITE = [Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT]

// Apply auth + school scoping to all routes
router.use(loginCheck, attachSchool)

/**
 * @openapi
 * /admission/search-parent:
 *   get:
 *     tags: [Admission]
 *     operationId: searchParentByPhone
 *     summary: Search existing parents by phone prefix
 *     description: Returns matching parent users for the school. Search starts from 2+ digits.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Partial phone number to search (prefix or contains match)
 *     responses:
 *       200:
 *         description: List of matching parents
 */
router.get("/search-parent", hasPermission(CAN_WRITE), admissionController.searchParentByPhone)

/**
 * @openapi
 * tags:
 *   name: Admission
 *   description: Student admission management — bulk CSV import, document upload, and individual admission creation
 */

/**
 * @openapi
 * /admission/bulk-upload:
 *   post:
 *     tags: [Admission]
 *     operationId: bulkUploadAdmissions
 *     summary: Bulk import admissions from a CSV file
 *     description: Principal, Admin Staff, or Accountant. Accepts a single CSV file and processes all rows as admission records.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV document file containing admission records
 *     responses:
 *       200:
 *         description: Bulk upload processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bulk upload processed successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                       example: 45
 *                     failed:
 *                       type: integer
 *                       example: 2
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/bulk-upload", hasPermission(CAN_WRITE), uploadMixed([FileFilterType.DOCUMENT]).single("file"), admissionController.bulkUpload)

/**
 * @openapi
 * /admission/upload-docs:
 *   post:
 *     tags: [Admission]
 *     operationId: uploadAdmissionDocs
 *     summary: Upload admission documents
 *     description: Principal, Admin Staff, or Accountant. Accepts up to 10 document or image files (e.g. birth certificate, photo) and persists them to S3.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of document or image files (max 10)
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Documents uploaded successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         format: uri
 *                       key:
 *                         type: string
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/upload-docs", hasPermission(CAN_WRITE), uploadMixed([FileFilterType.DOCUMENT, FileFilterType.IMAGE]).array("files", 10), persistAllToS3, admissionController.uploadDocs)

/**
 * @openapi
 * /admission:
 *   post:
 *     tags: [Admission]
 *     operationId: createAdmission
 *     summary: Create a single admission record
 *     description: Principal, Admin Staff, or Accountant. Creates a detailed admission record including personal, family, and fee information.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, surname, email, phone, gender]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Aarav
 *               surname:
 *                 type: string
 *                 example: Sharma
 *               email:
 *                 type: string
 *                 format: email
 *                 example: aarav.sharma@example.com
 *               phone:
 *                 type: string
 *                 example: "9801234567"
 *               gender:
 *                 $ref: '#/components/schemas/Gender'
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2015-06-15"
 *               bloodGroup:
 *                 type: string
 *                 example: "B+"
 *               admissionNumber:
 *                 type: string
 *                 example: "ADM-2025-001"
 *               appNo:
 *                 type: string
 *                 example: "APP-2025-001"
 *               dateOfAdmission:
 *                 type: string
 *                 format: date
 *                 description: Must be within the last 30 days; student must be at least 3 years old
 *                 example: "2025-04-01"
 *               className:
 *                 type: string
 *                 example: "Grade 1"
 *               studentInfo:
 *                 type: object
 *                 description: Additional student information (free-form)
 *               address:
 *                 type: object
 *                 properties:
 *                   province:
 *                     type: string
 *                     example: "Bagmati"
 *                   district:
 *                     type: string
 *                     example: "Kathmandu"
 *                   tole:
 *                     type: string
 *                     example: "Lazimpat"
 *                   houseNo:
 *                     type: string
 *                     example: "12A"
 *                   country:
 *                     type: string
 *                     example: "Nepal"
 *                   municipality:
 *                     type: string
 *                   wardNo:
 *                     type: string
 *                   postCode:
 *                     type: string
 *                   fullAddress:
 *                     type: string
 *                   isTemporarySame:
 *                     type: boolean
 *               father:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   qualification:
 *                     type: string
 *                   occupation:
 *                     type: string
 *               mother:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *               guardian:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *               familyInfo:
 *                 type: object
 *                 required: [emergencyContact]
 *                 properties:
 *                   emergencyContact:
 *                     type: string
 *                     enum: [father, mother, guardian]
 *                     description: Must match a parent record that has name and phone filled
 *                   maritalStatus:
 *                     type: string
 *                   custodyHolder:
 *                     type: string
 *               background:
 *                 type: object
 *                 description: Previous school / academic background (free-form)
 *               fees:
 *                 type: object
 *                 description: Fee-related information (free-form)
 *               declarationSigned:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Admission record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admission created successfully
 *                 result:
 *                   type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/", hasPermission(CAN_WRITE), bodyValidator(createAdmissionDTO), admissionController.create)

module.exports = router