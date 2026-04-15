const express = require('express');
const router = express.Router();
const TelegramBot = require('node-telegram-bot-api');
const { supabase } = require('../../lib/supabase');
const { geminiEmbed, geminiCategorize, geminiUrgencyScore, geminiSentimentScore } = require('../../lib/gemini');
const { autoAssignOfficer } = require('../../services/autoAssignService');
const { computeSlaDeadline } = require('../../services/slaService');
const auditService = require('../../services/auditService');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = token ? new TelegramBot(token) : null;

// Temporary in-memory session (In production, use Redis or Supabase table)
const botSessions = new Map();

router.post('/', async (req, res) => {
  console.log('📬 [TELEGRAM_SIGNAL_DETECTED] Incoming packet from Telegram Cloud...');
  const { message } = req.body;
  if (!message) {
    console.log('⚠️ Empty packet received.');
    return res.sendStatus(200);
  }

  const chatId = message.chat.id;
  const telegramUserId = message.from.id;
  const timestamp = new Date().toISOString();
  
  if (message.text) console.log(`📝 Text Signal: "${message.text}" from Chat ${chatId}`);

  try {
    // STEP 3: Handle Location Response
    if (message.location || (botSessions.has(chatId) && botSessions.get(chatId).waitingForLocation)) {
      await handleLocationStep(chatId, message);
      return res.sendStatus(200);
    }

    // STEP 2: Citizen Sends Initial Message
    if (message.text) {
      console.log(`📡 Telegram Signal Ingested: ${message.text} from ${telegramUserId}`);
      
      // Initialize Session for Priya
      botSessions.set(chatId, {
        originalText: message.text,
        slaStartTime: timestamp,
        waitingForLocation: true
      });

      if (bot) {
        await bot.sendMessage(chatId, "Thank you for reporting to UGIRP Mumbai. To assign the right officer, please share your location.\n\n📍 Tap the paperclip 📎 -> Location -> Share My Live Location\n🏙️ OR type your area name (e.g. Andheri West)");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Telegram Pipeline Failure:", err);
    res.sendStatus(200);
  }
});

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
    // Note: In production, geocode this text via Google Geocoding API
  }

  // STEP 4: Entire AI Pipeline Runs
  console.log("🧠 Triggering AI Pipeline for Telegram Signal...");
  
  const [catResult, embedding, keywordScore, sentimentScore] = await Promise.all([
    geminiCategorize(session.originalText),
    geminiEmbed(session.originalText),
    geminiUrgencyScore(session.originalText),
    geminiSentimentScore(session.originalText)
  ]);

  // Priority Formula Calculation (Step 4 Logic)
  const priority = Math.min(5, Math.max(1, Math.round((keywordScore * 3) + (sentimentScore * 2))));
  const slaDeadline = computeSlaDeadline(new Date(session.slaStartTime), catResult.category);

  // STEP 4 & 7: Master Ticket Ingestion (Source: TELEGRAM)
  const { data: ticket, error: tktError } = await supabase.from('master_tickets').insert({
    category: catResult.category,
    department: catResult.department || catResult.category,
    title: catResult.summary || session.originalText.substring(0, 50),
    description: `[TELEGRAM SIGNAL from ${locationText}] ${session.originalText}`,
    lat, lng,
    priority_score: priority,
    status: 'filed',
    source: 'TELEGRAM',
    sla_deadline: slaDeadline.toISOString(),
    created_at: session.slaStartTime, // SLA starts from first message time
    embedding
  }).select().single();

  if (tktError) throw tktError;

  // Record Complaint Trace with Smart-Tag for Telegram Callback
  await supabase.from('complaints').insert({
    master_ticket_id: ticket.id,
    raw_text: session.originalText,
    category: catResult.category,
    source: 'TELEGRAM',
    email: `tg_${chatId}@telegram.com`, // Forensic return-address node
    lat, lng,
    scraped_at: session.slaStartTime
  });

  // Forensic Audit Log
  await auditService.log({
    ticket_id: ticket.id,
    action: 'COMPLAINT_INGESTED',
    new_value: 'SOURCE: TELEGRAM'
  });

  await auditService.log({
    ticket_id: ticket.id,
    action: 'AI_CATEGORIZED',
    new_value: catResult.category
  });

  // STEP 5: Auto-Assignment
  const dispatch = await autoAssignOfficer(ticket.id, catResult.category, lat, lng, 'Mumbai');

  // STEP 6: Bot Replies to Citizen With Tracking Info
  if (bot) {
    const reply = `Your complaint has been registered successfully.\n\n` +
      `📌 Complaint ID: #${ticket.id.substring(0, 8)}\n` +
      `📂 Category: ${catResult.category}\n` +
      `⚡ Priority: ${priority} out of 5\n` +
      `👨‍✈️ Assigned to: ${dispatch.success ? dispatch.officer_name : 'Municipal Specialist'}\n` +
      `🕒 Resolution within 48 hours\n` +
      `📅 Deadline: ${formatDate(slaDeadline)}\n\n` +
      `Track your complaint: http://ugirp.vercel.app/track/${ticket.id}\n\n` +
      `You will receive updates here on Telegram when your complaint status changes.`;
    
    await bot.sendMessage(chatId, reply);
  }

  // Clear Session
  botSessions.delete(chatId);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(date);
}

module.exports = router;
