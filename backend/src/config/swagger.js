const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Paramount Academy — School ERP API",
      version: "1.0.0",
      description:
        "Full REST API documentation for the Paramount Academy School ERP System. " +
        "All protected endpoints require a Bearer JWT token obtained from POST /auth/login. " +
        "Global rate limit: 200 requests per 15 minutes per IP.",
      contact: {
        name: "Paramount Academy",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from POST /auth/login. Format: Bearer <token>",
        },
      },
      schemas: {
        // ─── Enums ───────────────────────────────────────────────────────────
        UserStatus: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"],
          example: "ACTIVE",
        },
        SchoolStatus: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "CLOSED", "NEW_REGISTRATION"],
          example: "ACTIVE",
        },
        Role: {
          type: "string",
          enum: ["SUPER_ADMIN", "PRINCIPAL", "ADMIN_STAFF", "ACCOUNTANT", "TEACHER", "STUDENT", "PARENT"],
          example: "TEACHER",
        },
        Gender: {
          type: "string",
          enum: ["MALE", "FEMALE", "OTHER"],
          example: "MALE",
        },
        AcademicStatus: {
          type: "string",
          enum: ["ENROLLED", "DROPPED", "TRANSFERRED"],
          example: "ENROLLED",
        },
        RelationType: {
          type: "string",
          enum: ["FATHER", "MOTHER", "GUARDIAN"],
          example: "FATHER",
        },
        FeeFrequency: {
          type: "string",
          enum: ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"],
          example: "MONTHLY",
        },
        PaymentMethod: {
          type: "string",
          enum: ["CASH", "CHECK", "BANK_TRANSFER", "ESEWA", "KHALTI", "IME_PAY", "CARD"],
          example: "CASH",
        },
        OnlinePaymentMethod: {
          type: "string",
          enum: ["esewa", "khalti", "ime_pay", "fone_pay", "card"],
          example: "esewa",
        },
        ManualPaymentMethod: {
          type: "string",
          enum: ["cash", "check", "bank_transfer"],
          example: "cash",
        },
        DiscountType: {
          type: "string",
          enum: ["PERCENTAGE", "FIXED_AMOUNT"],
          example: "PERCENTAGE",
        },
        ExamType: {
          type: "string",
          enum: ["QUIZ", "MIDTERM", "FINAL", "ASSIGNMENT"],
          example: "MIDTERM",
        },
        ExamStatus: {
          type: "string",
          enum: ["DRAFT", "PUBLISHED", "CLOSED"],
          example: "DRAFT",
        },
        AssignmentStatus: {
          type: "string",
          enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
          example: "DRAFT",
        },
        SubmissionStatus: {
          type: "string",
          enum: ["SUBMITTED", "REVIEWED", "GRADED"],
          example: "SUBMITTED",
        },
        DayOfWeek: {
          type: "string",
          enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
          example: "MONDAY",
        },
        // ─── Shared Object Schemas ────────────────────────────────────────────
        Address: {
          type: "object",
          required: ["province", "district", "fullAddress"],
          properties: {
            country: { type: "string", default: "Nepal", example: "Nepal" },
            province: { type: "string", example: "Province 1" },
            district: { type: "string", example: "Morang" },
            fullAddress: { type: "string", example: "Biratnagar-10, Main Road" },
          },
        },
        AddressOptional: {
          type: "object",
          properties: {
            country: { type: "string", default: "Nepal", example: "Nepal" },
            province: { type: "string", example: "Province 1" },
            district: { type: "string", example: "Morang" },
            fullAddress: { type: "string", example: "Biratnagar-10, Main Road" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            currentPage: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            total: { type: "integer", example: 42 },
          },
        },
        // ─── Standard Response Envelopes ─────────────────────────────────────
        StandardResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Operation successful" },
            result: { nullable: true },
            meta: { nullable: true },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "List fetched" },
            result: { type: "array", items: {} },
            meta: { $ref: "#/components/schemas/PaginationMeta" },
          },
        },
      },
      // ─── Reusable Response References ──────────────────────────────────────
      responses: {
        Unauthorized: {
          description: "Unauthorized – missing or invalid JWT token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Unauthorized" },
                  result: { type: "object", nullable: true },
                  meta: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        Forbidden: {
          description: "Forbidden – insufficient role permissions",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Forbidden" },
                  result: { type: "object", nullable: true },
                  meta: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        NotFound: {
          description: "Record not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Record not found." },
                  result: { type: "object", nullable: true },
                  meta: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        ValidationError: {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Validation error" },
                  result: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    example: { email: "\"email\" must be a valid email" },
                  },
                  meta: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: "Unexpected server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Internal server error" },
                  result: { type: "object", nullable: true },
                  meta: { type: "object", nullable: true },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/module/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
