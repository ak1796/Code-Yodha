const { geminiClassifySpam } = require('../lib/gemini');

// Devanagari Unicode block: U+0900â€“U+097F
const DEVANAGARI_RE = /[\u0900-\u097F]/;

/**
 * Returns true if the text is predominantly Indic (Devanagari) script.
 */
function isIndicText(text) {
  const devaCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
  const total = devaCount + latinCount;
  return total > 0 && devaCount / total > 0.3;
}

// Commercial / promotional / test / greeting keywords
const PROMO_PATTERN = /\b(buy|sell|offer|discount|free gift|click here|http|www\.|lottery|prize|won|winner|scam|spam|fake|testing|test123|asdfgh|qwerty|hello|hi|hey|good morning|namste)\b/i;

exports.filterSpam = async function(text) {
  const indic = isIndicText(text);
  const trimmed = text.trim();

  // â”€â”€ Rule 1: Repeated characters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Latin text: 3+ repeats after first char = 4+ total (catches "hhhh")
  // Indic scripts can legitimately have vowel modifier repeats â†’ raise to 8
  const repeatThreshold = indic ? 8 : 3;
  const repeatPattern = new RegExp(`(.)\\1{${repeatThreshold},}`);
  if (repeatPattern.test(trimmed)) {
    return { status: 'rejected', confidence: 0, reason: 'repeated_chars' };
  }

  // â”€â”€ Rule 2: Minimum character length â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const minLength = indic ? 4 : 20; // Increased Latin min length to 20
  if (trimmed.length < minLength) {
    return { status: 'rejected', confidence: 0, reason: 'too_short' };
  }

  // â”€â”€ Rule 3: Minimum meaningful word count â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // A real civic complaint needs a subject and verb (at least 4 words for English)
  if (!indic) {
    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 1).length;
    if (wordCount < 4) {
      return { status: 'rejected', confidence: 0, reason: 'insufficient_words' };
    }
  }

  // â”€â”€ Rule 4: Promotional / Greeting / Test keywords â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (PROMO_PATTERN.test(trimmed)) {
    return { status: 'rejected', confidence: 0, reason: 'promotional_content' };
  }

  // â”€â”€ Step 2: Gemini AI classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const result = await geminiClassifySpam(trimmed);
    if (result.classification !== 'COMPLAINT' || result.confidence < 0.7) {
      return { status: 'flagged', ...result };
    }
    return { status: 'clean', ...result };
  } catch (error) {
    console.warn('[SpamFilter] Gemini API unavailable â€” applying fallback pass.');
    return { status: 'clean', confidence: 0.5, reason: 'api_fallback' };
  }
};

