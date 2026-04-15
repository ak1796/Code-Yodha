import sys
import json
import re
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

def clean_text(raw_text):
    if not isinstance(raw_text, str):
        return ""
        
    # Basic normalization
    text = raw_text.lower()
    
    # Remove HTML tags
    text = re.sub(r'<[^>]*>', ' ', text)
    
    # Remove non-alphanumeric characters (keep basic punctuation)
    text = re.sub(r'[^a-z0-9\s.,]', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Stop words removal
    words = text.split()
    cleaned_words = [word for word in words if word not in ENGLISH_STOP_WORDS]
    
    return ' '.join(cleaned_words)

if __name__ == '__main__':
    try:
        # Read bulk JSON from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        dataset = json.loads(input_data)
        
        if not isinstance(dataset, list):
            dataset = [dataset]
            
        cleaned_dataset = []
        for row in dataset:
            cleaned_row = row.copy()
            # Clean common text fields
            if "raw_text" in row:
                cleaned_row["cleaned_text"] = clean_text(row["raw_text"])
            if "description" in row:
                cleaned_row["cleaned_description"] = clean_text(row["description"])
            
            cleaned_dataset.append(cleaned_row)
            
        print(json.dumps(cleaned_dataset))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
