const { execSync } = require('child_process');
const path = require('path');

/**
 * Data cleaning utility for NagarVaani
 */
const cleanComplaintText = (text) => {
  if (!text) return "";

  try {
    const pyScript = path.join(__dirname, 'preprocessor.py');
    const result = execSync(`python "${pyScript}"`, {
      input: JSON.stringify({ text }),
      encoding: 'utf-8'
    });
    const parsed = JSON.parse(result);
    if (parsed.cleaned_text) {
      return parsed.cleaned_text;
    }
  } catch (error) {
    console.error("Python preprocessing failed, falling back to basic cleaning:", error.message);
  }

  // Fallback basic cleaner
  let cleaned = text;
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  cleaned = cleaned.replace(/([?!.])\1+/g, '$1');
  return cleaned;
};

module.exports = { cleanComplaintText };
