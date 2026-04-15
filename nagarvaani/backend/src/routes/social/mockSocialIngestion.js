const { supabase } = require('../../lib/supabase');
const { geminiEmbed, geminiCategorize } = require('../../lib/gemini');

const MOCK_MUMBAI_LOCATIONS = [
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  { lat: 19.0330, lng: 73.0297, name: 'Navi Mumbai' },
  { lat: 19.1176, lng: 72.8480, name: 'Andheri' },
  { lat: 19.2183, lng: 72.9781, name: 'Thane' },
  { lat: 19.1827, lng: 72.8406, name: 'Goregaon' },
  { lat: 18.9219, lng: 72.8346, name: 'South Mumbai' }
];

const MOCK_COMPLAINT_TEMPLATES = [
  "Large pothole near Bandra station making travel dangerous.",
  "Water supply has been interrupted in Borivali for last 48 hours.",
  "Garbage collection has not happened in Powai for last 3 days.",
  "A huge tree has collapsed on the main road in Dadar.",
  "Street lights not working on the Link Road, Andheri West.",
  "Unauthorized construction happening near BKC junction, please investigate."
];

exports.ingestMockSocial = async function() {
  try {
    const randomTemplate = MOCK_COMPLAINT_TEMPLATES[Math.floor(Math.random() * MOCK_COMPLAINT_TEMPLATES.length)];
    const randomLoc = MOCK_MUMBAI_LOCATIONS[Math.floor(Math.random() * MOCK_MUMBAI_LOCATIONS.length)];
    const text = `[FEED] ${randomTemplate}`;

    // Pipeline logic (Simplified)
    const catResult = await geminiCategorize(text);
    const embedding = await geminiEmbed(text);

    const { data: ticket, error: ticketError } = await supabase.from('master_tickets').insert({
        category: catResult.category || 'OTHER',
        title: catResult.summary || randomTemplate,
        description: text,
        lat: randomLoc.lat, lng: randomLoc.lng,
        status: 'filed',
        source: 'mock_twitter',
        embedding
    }).select().single();

    if (ticketError) {
      console.error("[MOCK_INGESTION] Master Ticket Insert Error:", ticketError.message);
      return;
    }

    const { error: compError } = await supabase.from('complaints').insert({
        master_ticket_id: ticket.id,
        raw_text: text,
        lat: randomLoc.lat, lng: randomLoc.lng,
        source: 'mock_twitter',
        spam_status: 'clean'
    });

    if (compError) {
      console.error("[MOCK_INGESTION] Complaint Insert Error:", compError.message);
      return;
    }

    console.log(`[MOCK_INGESTION] Registered complaint: ${randomTemplate} at ${randomLoc.name}`);
  } catch (error) {
    console.error("Mock Ingestion Fatal Crash:", error);
  }
};
