export const translateText = async (text, fromLang, toLang = 'en') => {
  if (!text || !text.trim()) return '';
  if (fromLang === toLang) return text; // No translation needed

  try {
    // Extract base language code (e.g., 'ta-IN' -> 'ta')
    const sourceLang = fromLang.split('-')[0];
    const targetLang = toLang.split('-')[0];
    
    // Use Google Translate's free API endpoint for much higher accuracy
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Google returns a nested array where data[0] contains the translation blocks
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map(item => item[0]).join('');
    }
    
    console.warn('Translation API returned unexpected format', data);
    return text; // Fallback to original text if translation fails
  } catch (err) {
    console.error('Translation failed:', err);
    return text; // Fallback to original text
  }
};
