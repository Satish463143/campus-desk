const Joi = require('joi');

// ─── Online Payment ───────────────────────────────────────────────────────────

/**
 * Parent/student initiates an online payment.
 * amount can be a positive number (partial), or the string "all" to pay all dues.
 */
const initiatePaymentSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  amount: Joi.alternatives()
    .try(
      Joi.number().positive().precision(2),
      Joi.string().valid('all')
    )
    .required()
    .messages({ 'alternatives.match': '"amount" must be a positive number or "all"' }),
  paymentMethod: Joi.string()
    .valid('esewa', 'khalti', 'ime_pay', 'fone_pay', 'card')
    .required(),
  gatewayId: Joi.string().uuid().optional(),
});

/**
 * Client-side / gateway callback verification.
 * Extra gateway-specific fields are allowed via .unknown(true).
 */
const verifyPaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  gatewayReference: Joi.string().required(),
  transactionId: Joi.string().optional(),
  gatewayToken: Joi.string().optional(),
  encodedData: Joi.string().optional(), // eSewa base64 callback payload for HMAC verification
  status: Joi.string().valid('success', 'failed', 'cancelled').required(),
}).unknown(true);

// ─── Manual (Offline) Payment ─────────────────────────────────────────────────

/**
 * Accountant records a cash / cheque / bank-transfer payment on behalf of parent.
 */
const manualPaymentSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string()
    .valid('cash', 'check', 'bank_transfer')
    .required(),
  paymentDate: Joi.date().iso().default(() => new Date()),
  note: Joi.string().allow('', null).max(500).optional(),
  depositedBy: Joi.string().allow('', null).max(255).optional(),
  referenceNumber: Joi.string().allow('', null).max(100).optional(),
  receiptUrl: Joi.string().uri().allow('', null).optional(),
});

// ─── Gateway Management ───────────────────────────────────────────────────────

const createGatewaySchema = Joi.object({
  paymentMethod: Joi.string()
    .valid('cash', 'fone_pay', 'check', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'card')
    .required(),
  config: Joi.object().required(),
  isDefault: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const updateGatewaySchema = Joi.object({
  config: Joi.object().optional(),
  isDefault: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

module.exports = {
  initiatePaymentSchema,
  verifyPaymentSchema,
  manualPaymentSchema,
  createGatewaySchema,
  updateGatewaySchema,
};
