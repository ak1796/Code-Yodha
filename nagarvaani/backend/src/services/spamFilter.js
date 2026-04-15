const { geminiClassifySpam } = require('../lib/gemini');

const REGEX_SPAM_PATTERNS = [
  /(.)\1{4,}/,           // Repeated chars: "aaaaaaa"
  /\b(buy|sell|offer|discount|free|click here|http)\b/i,  // Promotional
  /^.{0,40}$/            // Too short (< ~10 words roughly)
];

exports.filterSpam = async function(text) {
  // Step 1: Regex
  for (const pattern of REGEX_SPAM_PATTERNS) {
    if (pattern.test(text)) return { status: 'rejected', confidence: 0, reason: 'regex' };
  }
  // Step 2: Gemini API
  try {
    const result = await geminiClassifySpam(text);
    if (result.classification !== 'COMPLAINT' || result.confidence < 0.7) {
      return { status: 'flagged', ...result };
    }
    return { status: 'clean', ...result };
  } catch (error) {
    // Gracefully handle Gemini failures
    console.warn("Spam filter API failed, proceeding cautiously.");
    return { status: 'clean', confidence: 0.5, reason: 'api_fallback' };
  }
};
