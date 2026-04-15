const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default Twilio Sandbox number

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

/**
 * Send a WhatsApp Message via Twilio
 * @param {string} to - The recipient's WhatsApp number (e.g., 'whatsapp:+919876543210')
 * @param {string} body - The message content
 */
exports.sendWhatsAppMessage = async (to, body) => {
    if (!client) {
        console.warn('⚠️ Twilio credentials missing. WhatsApp message suppressed:', body);
        return;
    }

    try {
        const response = await client.messages.create({
            from: whatsappFrom,
            to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
            body: body
        });
        console.log(`✅ WhatsApp Signal Dispatched to ${to}: ${response.sid}`);
        return response;
    } catch (err) {
        console.error('❌ Twilio WhatsApp Error:', err.message);
        throw err;
    }
};
