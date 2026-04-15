import sys
import json
import re

# Curated stop words for Civic context (covers English fundamentals)
CIVIC_STOP_WORDS = {
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'of', 'in', 'to', 'for', 'with', 
    'please', 'sir', 'madam', 'complaint', 'regarding', 'about', 'from', 'help', 
    'this', 'that', 'there', 'it', 'me', 'my', 'we', 'our', 'you', 'your'
}

def clean_text(raw_text):
    # Basic normalization
    text = str(raw_text).lower()
    
    # Remove HTML tags and extra punctuation
    text = re.sub(r'<[^>]*>', ' ', text)
    text = re.sub(r'[\!\"\#\$\%\&\'\(\)\*\+\,\-\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~]', ' ', text)
    
    # Keep alphanumeric characters and spaces
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Filter stop words
    words = text.split()
    cleaned_words = [w for w in words if w not in CIVIC_STOP_WORDS]
    
    cleaned_result = ' '.join(cleaned_words)
    
    return {
        "original": raw_text,
        "cleaned_text": cleaned_result,
        "tokens": len(cleaned_words)
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
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
