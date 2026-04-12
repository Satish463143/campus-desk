const express = require("express");
const cors = require("cors");
const router = require("./router.config");
require("dotenv").config();
require("./db.config");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { MulterError } = require('multer')
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();
app.set('trust proxy', 1);
app.use(helmet());


//  CORS (allow cross-origin requests)
const allowedOrigin = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000",
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : []),
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigin.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"]
}
app.use(cors(corsOptions));

// Rate limiting (protect from spam / abuse)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
}));

// 4️Compression (reduce response size)
app.use(compression());

//parsers
app.use(express.json({limit:"10kb"}));
app.use(express.urlencoded({ extended: true, limit:"10kb" }));

//routes ✅ FIXED: Added /api prefix
app.use('/api', router);

//swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//error handlers
app.use((req,res,next)=>{
    next()
})
app.use((req, res, next) => {
    next({ status: 404, message: "Resource not found." });
});

app.use((error, req, res, next) => {
    let statusCode = error.status || 500;
    let message = error.message || "Server Error..."
    let details = error.details || null

    // Handling Prisma Errors
    if (error.code === 'P2002') {
        statusCode = 400;
        message = "Validation error: Duplicate key";
        details = {};
        error.meta.target.forEach(field => {
            details[field] = `${field} should be unique`;
        });
    }

    if (error.code === 'P2025') {
        statusCode = 404;
        message = "Record not found.";
    }

    // legacy mongo unique Error validation
    if (error.code === 11000) {
        const uniqueFailedKeys = Object.keys(error.keyPattern)
        details = {}
        uniqueFailedKeys.map((field) => {
            details[field] = field + " should be unique"
        })
        statusCode = 400;
        message = "Validation error: Duplicate key";

    }
    // multer error handling (Image, video error)
    if (error instanceof MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            statusCode = 422,
                details = {
                    [error.field]: "File size too large. File must be less than 2MB"
                }
        }
    }

    res.status(statusCode).json({
        result: details,
        message: message,
        meta: null
    })
})

module.exports = app;