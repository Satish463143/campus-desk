const express = require('express');
const router = express.Router();
const publicPaymentController = require('./publicPayment.controller');

/**
 * @openapi
 * tags:
 *   name: Public Payment
 *   description: Unauthenticated endpoints for paying invoices via email links
 */

// GET /public/pay/invoice/:token - Validate token and get summary
router.get('/invoice/:token', publicPaymentController.getInvoiceDetails);

// POST /public/pay/invoice/:token/initiate - Start payment (eSewa/Khalti)
router.post('/invoice/:token/initiate', publicPaymentController.initiatePayment);

// POST /public/pay/invoice/:token/verify - Verify payment
router.post('/invoice/:token/verify', publicPaymentController.verifyPayment);

module.exports = router;
