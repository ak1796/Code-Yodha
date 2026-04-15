const { ApifyClient } = require('apify-client');
const { geminiCategorize, geminiEmbed, geminiSentimentScore, geminiUrgencyScore } = require('../lib/gemini');
const { runPythonScript } = require('../utils/pythonBridge');
const { supabase } = require('../lib/supabase');
const { deduplicateComplaint } = require('./deduplicator');
require('dotenv').config();

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

/**
 * Live Apify Social Ingestion Engine
 * Pulls real-world signals from Twitter and Reddit
 */
async function scrapeApifySignals() {
  if (process.env.USE_MOCK_SOCIAL === 'true' || !process.env.APIFY_TOKEN) {
    console.log("[Social Scraper] Skipping Apify, using Mock fallback.");
    const { ingestMockSocial } = require('../routes/social/mockSocialIngestion');
    return ingestMockSocial();
  }

  console.log("🚀 Initializing Apify Global Urban Pulse Ingestion...");

  try {
    // 1. Concurrent Scrape (Twitter Lite & Reddit)
    const twitterKeywords = ['#MumbaiRoads', '#MumbaiWater', '#BMCComplaints', 'pothole Mumbai', 'water leakage Mumbai', 'garbage Mumbai'];
    const subreddits = ['mumbai', 'delhi'];

    const twitterRun = await client.actor('apidojo/twitter-scraper-lite').call({
      searchTerms: twitterKeywords,
      maxItems: 10,
    });

    const redditRun = await client.actor('apify/reddit-scraper').call({
      subreddits: subreddits,
      searchKeywords: ['leakage', 'pothole', 'shortage', 'complaint'],
      maxItems: 5,
    });

    // 2. Fetch Datasets
    const { items: tweets } = await client.dataset(twitterRun.defaultDatasetId).listItems();
    const { items: redditPosts } = await client.dataset(redditRun.defaultDatasetId).listItems();

    const allSignals = [
      ...tweets.map(t => ({
        source: 'twitter',
        raw_text: t.full_text || t.text,
        lat: t.location?.lat || null,
        lng: t.location?.lng || null,
        url: t.url,
        user: t.user?.screen_name
      })),
      ...redditPosts.map(r => ({
        source: 'reddit',
        raw_text: `${r.title}\n${r.selfText}`,
        lat: null, // Reddit usually doesn't have exact GPS
        lng: null,
        url: r.url,
        user: r.author
      }))
    ];

    console.log(`[Social Scraper] Collected ${allSignals.length} raw signals. Processing pipeline...`);

    for (const signal of allSignals) {
      // Phase A: Python Preprocessing
      let processedText = signal.raw_text;
      try {
        const preResult = await runPythonScript('preprocessor.py', { text: signal.raw_text });
        processedText = preResult.cleaned_text || processedText;
      } catch (e) {
        console.warn("[Social Scraper] Preprocessor failed:", e.message);
      }

      // Phase B: AI Triage & Embedding
      const [category, embedding, sentiment, urgency] = await Promise.all([
        geminiCategorize(processedText),
        geminiEmbed(processedText),
        geminiSentimentScore(processedText),
        geminiUrgencyScore(processedText)
      ]);

      // Phase C: Deduplication
      const dedup = await deduplicateComplaint(signal, embedding);
      if (dedup.merged) {
        console.log(`[Social Scraper] Signal merged into Master Ticket: ${dedup.master_ticket_id}`);
        continue;
      }

      // Phase D: New Incident Creation
      const { data: ticket, error: ticketError } = await supabase.from('master_tickets').insert({
        category: category.category || 'OTHER',
        title: category.summary || processedText.substring(0, 50) + '...',
        description: signal.raw_text,
        lat: signal.lat,
        lng: signal.lng,
        status: 'filed',
        source: `social_${signal.source}`,
        embedding,
        priority_score: Math.min(5, Math.max(1, Math.round(urgency.keyword_score * 5))),
        metadata: {
            social_url: signal.url,
            social_user: signal.user,
            sentiment: sentiment.sentiment_score
        }
      }).select().single();

      if (ticketError) {
        console.error("[Social Scraper] DB Error:", ticketError.message);
        continue;
      }

      await supabase.from('complaints').insert({
        master_ticket_id: ticket.id,
        raw_text: signal.raw_text,
        lat: signal.lat,
        lng: signal.lng,
        source: `social_${signal.source}`,
        spam_status: 'clean'
      });

      console.log(`[Social Scraper] Logged new ${signal.source} signal: ${category.summary}`);
    }

  } catch (error) {
    console.error("❌ Apify Ingestion Engine Crash:", error.message);
  }
}

module.exports = { scrapeApifySignals };
