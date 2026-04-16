import sys
import json
import re
import unicodedata

# ── Stop words: English civic context ────────────────────────────────────────
CIVIC_STOP_WORDS_EN = {
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'of', 'in', 'to', 'for', 'with',
    'please', 'sir', 'madam', 'complaint', 'regarding', 'about', 'from', 'help',
    'this', 'that', 'there', 'it', 'me', 'my', 'we', 'our', 'you', 'your'
}

# ── Stop words: Hindi (Devanagari) ───────────────────────────────────────────
CIVIC_STOP_WORDS_HI = {
    'hai', 'hain', 'tha', 'the', 'ki', 'ke', 'ka', 'ko', 'se', 'mein', 'par', 'ek',
    'yeh', 'vah', 'aur', 'bhi', 'to', 'lekin', 'ki', 'ho', 'jo', 'hum', 'aap', 'main',
    # native Devanagari forms
    '\u0939\u0948', '\u0939\u0948\u0902', '\u0925\u093e', '\u0925\u0947',
    '\u0915\u0940', '\u0915\u0947', '\u0915\u093e', '\u0915\u094b',
    '\u0938\u0947', '\u092e\u0947\u0902', '\u092a\u0930', '\u090f\u0915',
    '\u092f\u0939', '\u0935\u0939', '\u0914\u0930', '\u092d\u0940',
    '\u0924\u094b', '\u092c\u0932\u094d\u0915\u093f', '\u091c\u094b',
    '\u0939\u092e', '\u0906\u092a', '\u092e\u0948\u0902',
    '\u0915\u0943\u092a\u092f\u093e', '\u0938\u093e\u0939\u092c',
    '\u0936\u093f\u0915\u093e\u092f\u0924', '\u0938\u092e\u0938\u094d\u092f\u093e',
    '\u092c\u093e\u0930\u0947', '\u092e\u0926\u0926'
}

# ── Stop words: Marathi (Devanagari) ─────────────────────────────────────────
CIVIC_STOP_WORDS_MR = {
    '\u0906\u0939\u0947', '\u0906\u0939\u0947\u0924', '\u0939\u094b\u0924\u0947',
    '\u0939\u094b\u0924\u0940', '\u091a\u0940', '\u091a\u094d\u092f\u093e',
    '\u0932\u093e', '\u0928\u0947', '\u092e\u0927\u094d\u092f\u0947',
    '\u0935\u0930', '\u090f\u0915', '\u0939\u0947', '\u0924\u0947', '\u0906\u0923\u093f',
    '\u092a\u0923', '\u0924\u0930', '\u092c\u0926\u094d\u0926\u0932',
    '\u0906\u092e\u094d\u0939\u0940', '\u0924\u0941\u092e\u094d\u0939\u0940',
    '\u092e\u0940', '\u0915\u0943\u092a\u092f\u093e', '\u0924\u0915\u094d\u0930\u093e\u0930',
    '\u0938\u092e\u0938\u094d\u092f\u093e', '\u092e\u0926\u0924'
}

ALL_STOP_WORDS = CIVIC_STOP_WORDS_EN | CIVIC_STOP_WORDS_HI | CIVIC_STOP_WORDS_MR

# Devanagari Unicode block range
DEVANAGARI_RE = re.compile(r'[\u0900-\u097F]', re.UNICODE)
LATIN_RE = re.compile(r'[a-zA-Z]')


def detect_script(text):
    """Returns dominant script: 'devanagari', 'latin', 'mixed', or 'unknown'."""
    deva_count = len(DEVANAGARI_RE.findall(text))
    latin_count = len(LATIN_RE.findall(text))
    total = deva_count + latin_count
    if total == 0:
        return 'unknown'
    ratio = deva_count / total
    if ratio > 0.6:
        return 'devanagari'
    if ratio < 0.4:
        return 'latin'
    return 'mixed'


def clean_text(raw_text):
    # Step 1: Unicode NFC normalization (critical for Indic rendering correctness)
    text = unicodedata.normalize('NFC', str(raw_text))

    # Step 2: Detect dominant script BEFORE lowercasing
    script = detect_script(text)

    # Step 3: Lowercase (safe for Devanagari — no case distinction)
    text = text.lower()

    # Step 4: Strip HTML tags
    text = re.sub(r'<[^>]*>', ' ', text, flags=re.UNICODE)

    # Step 5: Remove Devanagari sentence terminators (danda ।, double danda ॥)
    text = re.sub(r'[\u0964\u0965]', ' ', text)

    # Step 6: Remove common ASCII punctuation (preserve Devanagari characters)
    text = re.sub(
        r'[!"#$%&\'()*+,\-/:;<=>?@\[\\\]^`{|}~]',
        ' ', text, flags=re.UNICODE
    )

    # Step 7: Strip anything not a Unicode word char or whitespace
    # re.UNICODE ensures \w matches Hindi/Marathi Devanagari, Arabic, etc.
    text = re.sub(r'[^\w\s]', '', text, flags=re.UNICODE)

    # Step 8: Collapse extra whitespace
    text = re.sub(r'\s+', ' ', text, flags=re.UNICODE).strip()

    # Step 9: Filter combined stop word list
    words = text.split()
    cleaned_words = [w for w in words if w not in ALL_STOP_WORDS]
    cleaned_result = ' '.join(cleaned_words)

    return {
        "original": raw_text,
        "cleaned_text": cleaned_result,
        "tokens": len(cleaned_words),
        "language_detected": script   # 'latin' | 'devanagari' | 'mixed' | 'unknown'
    }


if __name__ == '__main__':
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "No input"}))
            sys.exit(0)

        data = json.loads(input_data)
        raw_text = data.get("text", "")

        result = clean_text(raw_text)
        # ensure_ascii=False preserves Devanagari in output
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
