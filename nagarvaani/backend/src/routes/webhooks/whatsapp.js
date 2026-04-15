const express = require('express');
const router = express.Router();
const { supabase } = require('../../lib/supabase');
const { geminiEmbed, geminiCategorize, geminiUrgencyScore, geminiSentimentScore } = require('../../lib/gemini');
const { autoAssignOfficer } = require('../../services/autoAssignService');
const { computeSlaDeadline } = require('../../services/slaService');
const auditService = require('../../services/auditService');
const { sendWhatsAppMessage } = require('../../services/whatsappService');

const whatsappSessions = new Map();

router.post('/', async (req, res) => {
    const { Body, From, Latitude, Longitude } = req.body;
    const whatsappUserId = From;
    const timestamp = new Date().toISOString();

    console.log(`📡 WhatsApp Signal Ingested: "${Body}" from ${whatsappUserId}`);

    try {
        // STEP 3: Handle Location Response
        if (Latitude || Longitude || (whatsappSessions.has(whatsappUserId) && whatsappSessions.get(whatsappUserId).waitingForLocation)) {
            await handleLocationStep(whatsappUserId, req.body);
            return res.status(200).send('<Response></Response>');
        }

        // STEP 2: Citizen Sends Initial Message
        if (Body) {
            if (Body.toLowerCase() === 'start' || Body.toLowerCase() === '/start') {
                await sendWhatsAppMessage(whatsappUserId, "Welcome to NagarVaani Mumbai! 🏙️\n\nI am your digital civic assistant. Please describe the municipal issue you'd like to report.");
                return res.status(200).send('<Response></Response>');
            }

            // Initialize Session
            whatsappSessions.set(whatsappUserId, {
                originalText: Body,
                slaStartTime: timestamp,
                waitingForLocation: true
            });

            await sendWhatsAppMessage(whatsappUserId, "Thank you for reporting to NagarVaani Mumbai. To assign the right officer, please *share your location* via WhatsApp.");
        }

        res.status(200).send('<Response></Response>');
    } catch (err) {
        console.error("❌ WhatsApp Pipeline Error:", err);
        res.status(200).send('<Response></Response>');
    }
});

async function handleLocationStep(userId, data) {
    const session = whatsappSessions.get(userId);
    if (!session) return;

    let lat = data.Latitude ? parseFloat(data.Latitude) : 19.0760;
    let lng = data.Longitude ? parseFloat(data.Longitude) : 72.8777;
    let locationText = data.Address || (data.Latitude ? "GPS Coordinates" : data.Body || "Mumbai");

    console.log(`🧠 Triggering AI Pipeline for WhatsApp Signal: ${session.originalText}`);
    
    try {
        const [catResult, embedding, keywordScore, sentimentScore] = await Promise.all([
            geminiCategorize(session.originalText),
            geminiEmbed(session.originalText),
            geminiUrgencyScore(session.originalText),
            geminiSentimentScore(session.originalText)
        ]);

        const category = catResult?.category || simpleKeywordCategorizer(session.originalText);
        const title = catResult?.summary || session.originalText.substring(0, 50) || "New WhatsApp Report";
        
        const kScore = keywordScore?.keyword_score || 0;
        const sScore = sentimentScore?.sentiment_score || 0;
        const priority = Math.min(5, Math.max(1, Math.round((kScore * 3) + (sScore * 2))));
        
        const slaDeadline = computeSlaDeadline(new Date(session.slaStartTime), category);

        // Master Ticket Insertion
        const { data: ticket, error: tktError } = await supabase.from('master_tickets').insert({
            category: category,
            department: catResult?.department || category,
            title: title,
            description: `[WHATSAPP SIGNAL from ${locationText}] ${session.originalText}`,
            lat, lng,
            priority_score: priority,
            status: 'filed',
            source: 'WHATSAPP',
            sla_deadline: slaDeadline.toISOString(),
            created_at: session.slaStartTime,
            embedding
        }).select().single();

        if (tktError) throw tktError;

        await supabase.from('complaints').insert({
            master_ticket_id: ticket.id,
            raw_text: session.originalText,
            category: category,
            source: 'WHATSAPP',
            email: `wa_${userId.replace('whatsapp:', '')}@whatsapp.com`,
            lat, lng,
            scraped_at: session.slaStartTime
        });

        await auditService.log({
            ticket_id: ticket.id,
            action: 'COMPLAINT_INGESTED',
            new_value: 'SOURCE: WHATSAPP'
        });

        const dispatch = await autoAssignOfficer(ticket.id, category, lat, lng, 'Mumbai');

        const reply = `*Your complaint has been registered successfully! 🎉*\n\n` +
            `📌 *ID:* #${ticket.id.substring(0, 8)}\n` +
            `📂 *Category:* ${category}\n` +
            `⚡ *Priority:* ${priority}/5\n` +
            `👨‍✈️ *Assigned:* ${dispatch.success ? dispatch.officer_name : 'Municipal Specialist'}\n` +
            `🕒 *SLA Deadline:* ${formatDate(slaDeadline)}\n\n` +
            `🔗 *Track Live:* http://localhost:5173/track/${ticket.id}\n\n` +
            `We will notify you here when the status changes.`;
        
        await sendWhatsAppMessage(userId, reply);
    } catch (e) {
        console.error("❌ WhatsApp Pipeline Error:", e);
        await sendWhatsAppMessage(userId, "Sorry, I encountered an error processing your request. Please try again later.");
    }

    whatsappSessions.delete(userId);
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

module.exports = router;
