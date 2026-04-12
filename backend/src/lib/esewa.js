/**
 * eSewa v2 payment helper
 *
 * Uses only Node built-ins (crypto, https) — no extra dependencies.
 *
 * Flow:
 *  1. initiateOnlinePayment calls buildInitiateParams → returns { url, params }
 *     Frontend POSTs `params` as a form to `url`.
 *  2. eSewa redirects to successUrl?data=<base64>
 *     Frontend sends encodedData to /payment/verify.
 *  3. verifyOnlinePayment calls decodeAndVerifyCallback (HMAC check)
 *     then checkTransactionStatus (server-side API confirmation).
 */

const crypto = require("crypto");
const https  = require("https");

const ESEWA_BASE = {
  test: "https://rc-epay.esewa.com.np",
  live: "https://epay.esewa.com.np",
};

/** HMAC-SHA256 base64 over comma-joined "key=val" pairs */
function sign(fields, secretKey) {
  const message = fields.map(([k, v]) => `${k}=${v}`).join(",");
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

/**
 * Build the signed form params to POST to eSewa's payment page.
 * @param {object} config  - gateway config: { merchantCode, secretKey, successUrl, failureUrl, env }
 * @param {object} opts    - { totalAmount: string, transactionUuid: string }
 * @returns {{ url: string, params: object }}
 */
function buildInitiateParams(config, { totalAmount, transactionUuid }) {
  const env = config.env === "live" ? "live" : "test";
  const url = `${ESEWA_BASE[env]}/api/epay/main/v2/form`;

  const signedFields = [
    ["total_amount",     totalAmount],
    ["transaction_uuid", transactionUuid],
    ["product_code",     config.merchantCode],
  ];

  const params = {
    amount:                  totalAmount,
    tax_amount:              "0",
    total_amount:            totalAmount,
    transaction_uuid:        transactionUuid,
    product_code:            config.merchantCode,
    product_service_charge:  "0",
    product_delivery_charge: "0",
    success_url:             config.successUrl,
    failure_url:             config.failureUrl,
    signed_field_names:      "total_amount,transaction_uuid,product_code",
    signature:               sign(signedFields, config.secretKey),
  };

  return { url, params };
}

/**
 * Decode and verify eSewa's base64-encoded callback data.
 * Throws if HMAC signature doesn't match (tampered response).
 * @param {string} encodedData - base64 string from eSewa success_url ?data= param
 * @param {string} secretKey   - from gateway config
 * @returns {object} decoded payload
 */
function decodeAndVerifyCallback(encodedData, secretKey) {
  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf8"));
  } catch {
    throw new Error("Failed to decode eSewa callback data");
  }

  if (!decoded.signed_field_names || !decoded.signature) {
    throw new Error("eSewa callback missing signature fields");
  }

  const sigFields = decoded.signed_field_names.split(",");
  const message   = sigFields.map(f => `${f}=${decoded[f]}`).join(",");
  const expected  = crypto.createHmac("sha256", secretKey).update(message).digest("base64");

  if (expected !== decoded.signature) {
    throw new Error("eSewa signature mismatch — possible tampered response");
  }

  return decoded;
}

/**
 * Call eSewa's transaction status API for server-side confirmation.
 * @param {object} config - gateway config: { merchantCode, env }
 * @param {object} opts   - { totalAmount: string, transactionUuid: string }
 * @returns {Promise<object>} eSewa status response, e.g. { status: "COMPLETE", ... }
 */
function checkTransactionStatus(config, { totalAmount, transactionUuid }) {
  const env = config.env === "live" ? "live" : "test";
  const qs  = new URLSearchParams({
    product_code:     config.merchantCode,
    total_amount:     String(totalAmount),
    transaction_uuid: transactionUuid,
  });
  const url = `${ESEWA_BASE[env]}/api/epay/transaction/status/?${qs}`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("Invalid JSON from eSewa status API"));
          }
        });
      })
      .on("error", reject);
  });
}

module.exports = { buildInitiateParams, decodeAndVerifyCallback, checkTransactionStatus };
