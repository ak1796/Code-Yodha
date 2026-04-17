const TelegramBot = require('node-telegram-bot-api');
const { supabase } = require('../lib/supabase');
const { geminiEmbed, geminiCategorize, geminiUrgencyScore, geminiSentimentScore } = require('../lib/gemini');
const { autoAssignOfficer } = require('./autoAssignService');
const { computePriorityScore } = require('./urgencyScorer');
const { computeSlaDeadline } = require('./slaService');
const { sendEmail } = require('./notificationService');
const auditService = require('./auditService');

// In-memory sessions for Anti-Spam (Throttle Control)
const sessions = {};
const SPAM_THRESHOLD_MS = 60000; // 1 minute
const MAX_SIGNALS_PER_WINDOW = 3;

// Temporary in-memory session (In production, use Redis or Supabase table)
const botSessions = new Map();

let bot = null;

const initTelegramBot = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('âš ï¸ TELEGRAM_BOT_TOKEN not found in env. Telegram bot will not start.');
        return;
    }

    bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (message) => {
        const chatId = message.chat.id;
        const now = Date.now();

        // Anti-Spam Strategy: Rate-Limit Forensic
        if (!sessions[chatId]) {
            sessions[chatId] = { timestamps: [], originalText: "" };
        }
        
        // Clean up old timestamps
        sessions[chatId].timestamps = sessions[chatId].timestamps.filter(t => now - t < SPAM_THRESHOLD_MS);
        
        if (sessions[chatId].timestamps.length >= MAX_SIGNALS_PER_WINDOW) {
            console.warn(`ðŸ›¡ï¸ Signal Surge detected for Chat ${chatId}. Throttling...`);
            return await bot.sendMessage(chatId, "âš ï¸ <b>SIGNAL OVERLOAD:</b> Too many reports in a short window. Please wait 60s for Forensic Ledger sync.", { parse_mode: 'HTML' });
        }
        
        sessions[chatId].timestamps.push(now);

        const telegramUserId = message.from.id;
        const timestamp = new Date().toISOString();

        try {
            // STEP 3: Handle Location Response
            if (message.location || (botSessions.has(chatId) && botSessions.get(chatId).waitingForLocation)) {
                await handleLocationStep(chatId, message);
                return;
            }

            // STEP 2: Citizen Sends Initial Message
            if (message.text) {
                if (message.text === '/start') {
                    const welcomeMsg = 
                        "Welcome to NagarVaani Mumbai! ðŸ™ï¸\n" +
                        "à¤¨à¤—à¤°à¤µà¤¾à¤£à¥€ à¤®à¥à¤‚à¤¬à¤ˆà¤®à¤§à¥à¤¯à¥‡ à¤†à¤ªà¤²à¥‡ à¤¸à¥à¤µà¤¾à¤—à¤¤ à¤†à¤¹à¥‡! 🚩\n" +
                        "à¤¨à¤—à¤°à¤µà¤¾à¤£à¥€ à¤®à¥à¤‚à¤¬à¤ˆ à¤®à¥‡à¤‚ à¤†à¤ªà¤•à¤¾ à¤¸à¥à¤µà¤¾à¤—à¤¤ à¤¹à¥ˆ! 🇮🇳\n\n" +
                        "I am your digital civic assistant. Please describe the problem (e.g., 'Pot hole on MG Road').\n" +
                        "à¤®à¥€ à¤¤à¥à¤®à¤šà¤¾ à¤¡à¤¿à¤œà¤¿à¤Ÿà¤² à¤¨à¤¾à¤—à¤°à¥€ à¤¸à¤¹à¤¾à¤¯à¥à¤¯à¤• à¤†à¤¹à¥‡. à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¸à¤®à¤¸à¥à¤¯à¤¾ à¤¸à¤¾à¤‚à¤—à¤¾ (à¤‰à¤¦à¤¾. 'MG à¤°à¥‹à¤¡à¤µà¤° à¤–à¤¡à¥à¤¡à¤¾ à¤†à¤¹à¥‡').\n" +
                        "à¤®à¥ˆà¤‚ à¤†à¤ªà¤•à¤¾ à¤¡à¤¿à¤œà¤¿à¤Ÿà¤² à¤¨à¤¾à¤—à¤°à¤¿à¤• à¤¸à¤¹à¤¾à¤¯à¤• à¤¹à¥‚à¤à¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¸à¤®à¤¸à¥à¤¯à¤¾ à¤¬à¤¤à¤¾à¤à¤‚ (à¤‰à¤¦à¤¾. 'MG à¤°à¥‹à¤¡ à¤ªà¤° à¤—à¤¡à¥à¤¢à¤¾ à¤¹à¥ˆ')à¥¤";
                    await bot.sendMessage(chatId, welcomeMsg);
                    return;
                }

                console.log(`📡 Telegram Signal Ingested: ${message.text} from ${telegramUserId}`);
                
                // STEP 1.5: Spam Check
                const spamCheck = await filterSpam(message.text);
                if (spamCheck.status === 'rejected' || spamCheck.status === 'flagged') {
                  console.log(`🚫 Telegram Signal Rejected: ${spamCheck.reason}`);
                  await bot.sendMessage(chatId, "âš ï¸ Invalid Signal / à¤…à¤®à¤¾à¤¨à¥à¤¯ à¤¸à¤¿à¤—à¥à¤¨à¤² / à¤…à¤®à¤¾à¤¨à¥à¤¯ à¤¸à¤‚à¤¦à¥‡à¤¶\n\nPlease provide a clear description (e.g., 'Water leak').\nà¤•à¥ƒà¤ªà¤¯à¤¾ à¤¸à¥à¤ªà¤·à¥à¤Ÿ à¤µà¤°à¥à¤£à¤¨ à¤¦à¥à¤¯à¤¾ (à¤‰à¤¦à¤¾. 'पाणी गळती').\nà¤•à¥ƒà¤ªà¤¯à¤¾ à¤¸à¥à¤ªà¤·à¥à¤Ÿ à¤µà¤¿à¤µà¤°à¤£ à¤¦à¥‡à¤‚ (à¤‰à¤¦à¤¾. 'पानी का रिसाव')à¥¤");
                  return;
                }

                // Initialize Session
                botSessions.set(chatId, {
                    originalText: message.text,
                    slaStartTime: timestamp,
                    waitingForLocation: true
                });

                const locationReq = 
                    "Thank you! Now please share your LOCATION ðŸ“\n" +
                    "à¤§à¤¨à¥à¤¯à¤µà¤¾à¤¦! à¤†à¤¤à¤¾ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¤à¥à¤®à¤šà¥‡ à¤¸à¥à¤¥à¤¾à¤¨ (LOCATION) à¤¶à¥‡à¤…à¤° à¤•à¤°à¤¾ ðŸ“\n" +
                    "à¤§à¤¨à¥à¤¯à¤µà¤¾à¤¦! à¤…à¤¬ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤…à¤ªà¤¨à¤¾ à¤¸à¥à¤¥à¤¾à¤¨ (LOCATION) à¤¸à¤¾à¤à¤¾ à¤•à¤°à¥‡à¤‚ ðŸ“\n\n" +
                    "📎 Tap 📎 -> Location -> Share My Live Location";
                await bot.sendMessage(chatId, locationReq);
            }
        } catch (err) {
            console.error("âŒ Telegram Bot Error:", err);
        }
    });

    bot.on('polling_error', (error) => {
        if (error.code === 'ETELEGRAM' && error.message.includes('401')) {
            console.error('🛑 [TELEGRAM STOPPED] 401 Unauthorized: Your TELEGRAM_BOT_TOKEN is invalid.');
            console.error('Please get a fresh token from @BotFather and restart the server.');
            bot.stopPolling();
        } else {
            console.error('âš ï¸ Telegram Polling Error:', error.message);
        }
    });

    console.log('🤖 Telegram Bot initialized in Polling Mode');
};

async function handleLocationStep(chatId, message) {
    const session = botSessions.get(chatId);
    if (!session) return;

    let lat = 19.0760, lng = 72.8777; // Mumbai baseline
    let locationText = "Mumbai";

    if (message.location) {
        lat = message.location.latitude;
        lng = message.location.longitude;
        locationText = "GPS Coordinates";
    } else if (message.text) {
        locationText = message.text;
    }

        // AI Pipeline
        console.log("🧠 Triggering AI Pipeline for Telegram Signal:", session.originalText);
        
        try {
            const [catResult, embedding, keywordScore, sentimentScore] = await Promise.all([
                geminiCategorize(session.originalText),
                geminiEmbed(session.originalText),
                geminiUrgencyScore(session.originalText),
                geminiSentimentScore(session.originalText)
            ]);

            console.log("✅ AI Insights Generated:", catResult);

            const category = catResult?.category || simpleKeywordCategorizer(session.originalText);
            const title = catResult?.summary || session.originalText.substring(0, 50) || "New Telegram Report";
            
            const priority = await computePriorityScore({
                keywordScore: kScore,
                sentimentScore: sScore,
                clusterSize: 1, // Will be updated by deduplicator if merged
                lat, lng
            });
            
            const slaDeadline = computeSlaDeadline(new Date(session.slaStartTime), category);

            // Master Ticket Insertion
            const { data: ticket, error: tktError } = await supabase.from('master_tickets').insert({
                category: category,
                department: catResult?.department || category,
                title: title,
                description: `[TELEGRAM SIGNAL from ${locationText}] ${session.originalText}`,
                lat, lng,
                priority_score: priority,
                status: 'filed',
                source: 'TELEGRAM',
                sla_deadline: slaDeadline.toISOString(),
                created_at: session.slaStartTime,
                embedding
            }).select().single();

            if (tktError) throw tktError;

            await supabase.from('complaints').insert({
                master_ticket_id: ticket.id,
                raw_text: session.originalText,
                category: category,
                source: 'TELEGRAM',
                email: `tg_${chatId}@telegram.com`,
                lat, lng,
                scraped_at: session.slaStartTime
            });

            await auditService.log({
                ticket_id: ticket.id,
                action: 'COMPLAINT_INGESTED',
                new_value: 'SOURCE: TELEGRAM'
            });

            const dispatch = await autoAssignOfficer(ticket.id, category, lat, lng, 'Mumbai');

            const reply = `<b>Your complaint has been registered successfully! 🎉</b>\n\n` +
                `📌 <b>ID:</b> #${ticket.id.substring(0, 8)}\n` +
                `📂 <b>Category:</b> ${category}\n` +
                `⚡ <b>Priority:</b> ${priority}/5\n` +
                `ðŸ‘¨â€âœˆï¸ <b>Assigned:</b> ${dispatch.success ? dispatch.officer_name : 'Municipal Specialist'}\n` +
                `🕒 <b>SLA Deadline:</b> ${formatDate(slaDeadline)}\n\n` +
                `🔗 <a href="http://localhost:5173/track/${ticket.id}">Track Live Here</a>\n\n` +
                `I will notify you here when the status changes.`;
            
            await bot.sendMessage(chatId, reply, { parse_mode: 'HTML' });
        } catch (e) {
        console.error("âŒ Pipeline Error:", e);
        await bot.sendMessage(chatId, "Sorry, I encountered an error processing your request. Please try again later.");
    }

    botSessions.delete(chatId);
}

function simpleKeywordCategorizer(text) {
    const lower = text.toLowerCase();
    if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) return 'WATER';
    if (lower.includes('drain') || lower.includes('sewage') || lower.includes('gutter')) return 'DRAINAGE';
    if (lower.includes('road') || lower.includes('pothole') || lower.includes('path')) return 'ROADS';
    if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste')) return 'GARBAGE';
    if (lower.includes('electricity') || lower.includes('light') || lower.includes('current') || lower.includes('wire')) return 'ELECTRICITY';
    return 'OTHER';
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    }).format(date);
}

module.exports = { initTelegramBot };