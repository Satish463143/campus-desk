/**
 * SMS Service — STUB IMPLEMENTATION
 *
 * Replace this stub with a real SMS provider integration for production.
 *
 * Recommended providers for Nepal:
 *   - Sparrow SMS: https://sparrowsms.com/api
 *   - Aakash SMS: https://aakashsms.com
 *
 * Required environment variables (add to .env when integrating):
 *   SMS_API_KEY=your_api_key
 *   SMS_SENDER_ID=your_sender_id
 *   SMS_API_URL=https://api.sparrowsms.com/v2/sms/  (example)
 */

/**
 * Send an SMS to a phone number.
 * @param {string} phone - Recipient phone number (e.g. "+977-9800000000")
 * @param {string} message - Message text (max 160 chars for single SMS)
 * @returns {Promise<void>}
 */
const sendSMS = async (phone, message) => {
    if (!phone) {
        console.warn('[SMS STUB] Skipped: no phone number provided');
        return;
    }
    // TODO: Replace this block with real SMS provider API call
    // Example Sparrow SMS integration:
    // const response = await axios.post(process.env.SMS_API_URL, {
    //   token: process.env.SMS_API_KEY,
    //   from: process.env.SMS_SENDER_ID,
    //   to: phone,
    //   text: message,
    // });
    console.log(`[SMS STUB] To: ${phone} | Message: ${message}`);
};

module.exports = { sendSMS };
