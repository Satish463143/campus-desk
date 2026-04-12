/**
 * Khalti v2 (KPG-2) payment helper
 *
 * Uses only Node built-ins (https) — no extra dependencies.
 */

const https = require("https");
const { URL } = require("url");

const KHALTI_BASE = {
  test: "https://a.khalti.com/api/v2",
  live: "https://khalti.com/api/v2",
};

/**
 * Native HTTPS Promisified Request
 */
function _request(urlStr, method, headers, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Invalid JSON from Khalti API"));
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Initiates a Khalti Web Checkout Payment Request.
 * @param {object} config - gateway config: { secretKey, returnUrl, websiteUrl, env }
 * @param {object} opts   - { totalAmount: string, transactionUuid: string, studentName: string }
 * @returns {Promise<object>} Khalti response { pidx, payment_url, expires_at, expires_in }
 */
async function initiatePayment(config, opts) {
  const env = config.env === "live" ? "live" : "test";
  const baseUrl = KHALTI_BASE[env];
  const url = `${baseUrl}/epayment/initiate/`;

  const payload = {
    return_url: config.returnUrl || "http://localhost:3000/payment/success",
    website_url: config.websiteUrl || "http://localhost:3000",
    amount: parseInt(opts.totalAmount, 10), // must be in paisa (multiplied by 100 before passing)
    purchase_order_id: opts.transactionUuid,
    purchase_order_name: "Fee Payment",
    customer_info: {
      name: opts.studentName || "Student",
      email: opts.studentEmail || "student@example.com",
      phone: opts.studentPhone || "9800000000",
    },
  };

  const response = await _request(url, "POST", { Authorization: `Key ${config.secretKey}` }, payload);

  if (response.error_key || !response.pidx) {
    throw { status: 400, message: response.detail || "Khalti initiation failed", khaltiRes: response };
  }

  return response;
}

/**
 * Verify Khalti payment status using pidx (Server-side lookup).
 * @param {object} config - gateway config: { secretKey, env }
 * @param {string} pidx   - Khalti payment identifier generated during initiation
 * @returns {Promise<object>} Khalti lookup { pidx, total_amount, status, transaction_id, fee, refunded }
 */
async function lookupPayment(config, pidx) {
  const env = config.env === "live" ? "live" : "test";
  const baseUrl = KHALTI_BASE[env];
  const url = `${baseUrl}/epayment/lookup/`;

  const payload = { pidx };

  const response = await _request(url, "POST", { Authorization: `Key ${config.secretKey}` }, payload);

  if (response.error_key) {
    throw { status: 400, message: response.detail || "Khalti lookup failed", khaltiRes: response };
  }

  return response;
}

module.exports = { initiatePayment, lookupPayment };
