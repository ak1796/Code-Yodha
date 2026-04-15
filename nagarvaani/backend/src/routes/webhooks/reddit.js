const express = require('express');
const router = express.Router();
const Snoowrap = require('snoowrap');
const { supabase } = require('../../lib/supabase');
const { geminiEmbed, geminiCategorize } = require('../../lib/gemini');

const reddit = process.env.REDDIT_CLIENT_ID ? new Snoowrap({
  userAgent: 'nagarvaani-scraper-v1',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
}) : null;

router.get('/scrape', async (req, res) => {
  if (!reddit) return res.status(200).json({ error: 'Reddit credentials missing' });

  try {
    const subreddits = ['mumbai', 'delhi', 'bangalore'];
    const keywords = ['pothole', 'garbage', 'water supply', 'electricity', 'roads'];
    
    for (const subName of subreddits) {
        const sub = await reddit.getSubreddit(subName).getNew({ limit: 10 });
        for (const post of sub) {
            const text = post.title + " " + post.selftext;
            if (keywords.some(k => text.toLowerCase().includes(k))) {
                // Pipeline logic (Simplified)
                const catResult = await geminiCategorize(text);
                const embedding = await geminiEmbed(text);

                // Check if already scraped
                const { data: exist } = await supabase.from('complaints').select('id').eq('raw_text', text).single();
                if (exist) continue;

                const { data: ticket } = await supabase.from('master_tickets').insert({
                    category: catResult.category,
                    title: catResult.summary,
                    description: text,
                    lat: 19.0760, lng: 72.8777, // Mock
                    status: 'filed',
                    source: 'reddit',
                    embedding
                }).select().single();

                await supabase.from('complaints').insert({
                    master_ticket_id: ticket.id,
                    raw_text: text,
                    lat: 19.0760, lng: 72.8777,
                    source: 'reddit',
                    scraped_at: new Date(post.created_utc * 1000).toISOString()
                });
            }
        }
    }
    res.json({ message: 'Reddit scraping complete' });
  } catch (error) {
    console.error("Reddit Scraper Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
