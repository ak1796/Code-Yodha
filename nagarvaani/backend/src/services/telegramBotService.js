const TelegramBot = require('node-telegram-bot-api');
const { supabase } = require('../lib/supabase');
const { geminiEmbed, geminiCategorize, geminiUrgencyScore, geminiSentimentScore } = require('../lib/gemini');
const { autoAssignOfficer } = require('./autoAssignService');
const { computeSlaDeadline } = require('./slaService');
const auditService = require('./auditService');

// Temporary in-memory session (In production, use Redis or Supabase table)
const botSessions = new Map();

let bot = null;

const initTelegramBot = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('⚠️ TELEGRAM_BOT_TOKEN not found in env. Telegram bot will not start.');
        return;
    }

    bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (message) => {
        const chatId = message.chat.id;
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
                    await bot.sendMessage(chatId, "Welcome to NagarVaani Mumbai! 🏙️\n\nI am your digital civic assistant. Please describe the municipal issue you'd like to report (e.g., 'Pot hole on MG Road' or 'Garbage piling up in Bandra').");
                    return;
                }

                console.log(`📡 Telegram Signal Ingested: ${message.text} from ${telegramUserId}`);
                
                // Initialize Session
                botSessions.set(chatId, {
                    originalText: message.text,
                    slaStartTime: timestamp,
                    waitingForLocation: true
                });

                await bot.sendMessage(chatId, "Thank you for reporting to NagarVaani Mumbai. To assign the right officer, please share your location.\n\n📍 Tap the paperclip 📎 -> Location -> Share My Live Location\n🏙️ OR type your area name (e.g. Andheri West)");
            }
        } catch (err) {
            console.error("❌ Telegram Bot Error:", err);
        }
    });

    bot.on('polling_error', (error) => {
        if (error.code === 'ETELEGRAM' && error.message.includes('401')) {
            console.error('🛑 [TELEGRAM STOPPED] 401 Unauthorized: Your TELEGRAM_BOT_TOKEN is invalid.');
            console.error('Please get a fresh token from @BotFather and restart the server.');
            bot.stopPolling();
        } else {
            console.error('⚠️ Telegram Polling Error:', error.message);
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
            
            const kScore = keywordScore?.keyword_score || 0;
            const sScore = sentimentScore?.sentiment_score || 0;
            const priority = Math.min(5, Math.max(1, Math.round((kScore * 3) + (sScore * 2))));
            
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
                `👨‍✈️ <b>Assigned:</b> ${dispatch.success ? dispatch.officer_name : 'Municipal Specialist'}\n` +
                `🕒 <b>SLA Deadline:</b> ${formatDate(slaDeadline)}\n\n` +
                `🔗 <a href="http://localhost:5173/track/${ticket.id}">Track Live Here</a>\n\n` +
                `I will notify you here when the status changes.`;
            
            await bot.sendMessage(chatId, reply, { parse_mode: 'HTML' });
        } catch (e) {
        console.error("❌ Pipeline Error:", e);
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
