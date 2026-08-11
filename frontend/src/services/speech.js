// Browser Web Speech API wrappers with Smart Sentence Cleaning & Deduplication

// Deduplicate repeating words/phrases and format clean sentences
export const cleanTranscript = (rawText) => {
  if (!rawText) return '';

  let text = rawText.trim();

  // 1. Remove duplicate adjacent words (case-insensitive) e.g., "i i" -> "I", "need need" -> "need"
  text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // 2. Remove duplicate consecutive phrases e.g., "I need to buy I need to buy" -> "I need to buy"
  text = text.replace(/(.+?)\s+\1\b/gi, '$1');

  // 3. Remove duplicate sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  const uniqueSentences = [];
  for (let sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed && !uniqueSentences.includes(trimmed)) {
      // Capitalize first letter of sentence
      const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      uniqueSentences.push(formatted);
    }
  }

  let result = uniqueSentences.join(' ');

  // Ensure first character is capitalized and ends with proper punctuation
  if (result) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
    if (!/[.!?]$/.test(result)) {
      result += '.';
    }
  }

  return result;
};

// Check Web Speech API support
export const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// Listen to speech and return clean transcribed sentence
export const listenToSpeech = (onResult, onError, onEnd, lang = 'en-US') => {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError('Voice input is not supported in this browser. Try Chrome or Edge.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false; // Capture one clear sentence/phrase per tap
  recognition.interimResults = false; // Only return finalized speech recognition
  recognition.lang = lang;

  recognition.onresult = (event) => {
    let rawTranscript = '';
    for (let i = 0; i < event.results.length; ++i) {
      rawTranscript += event.results[i][0].transcript + ' ';
    }
    
    const cleaned = cleanTranscript(rawTranscript);
    if (cleaned && onResult) {
      onResult(cleaned);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    let errorMsg = event.error;
    if (event.error === 'network') {
      errorMsg = 'Network error: Voice input requires an active connection or is blocked by your proxy.';
    }
    if (onError) onError(errorMsg);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.start();
  return recognition;
};

// Text to Speech Read Aloud
export const speakText = (text, rate = 0.85, pitch = 1.0) => {
  if (!isSpeechSynthesisSupported()) {
    alert('Speech synthesis is not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel(); // Stop any active speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = 'en-US';

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
};
