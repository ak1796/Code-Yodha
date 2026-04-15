import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useVoiceInput() {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    
    rec.lang = i18n.language === 'hi' ? 'hi-IN' : 
               i18n.language === 'mr' ? 'mr-IN' : 
               i18n.language === 'bn' ? 'bn-IN' : 'en-IN';

    rec.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, [i18n.language]);

  const startListening = () => {
    if (recognition) {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return { isListening, transcript, startListening, stopListening, hasSupport: !!recognition };
}
