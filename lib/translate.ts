// Translation service using Google Gemini Flash 2.0
// Gemini Flash 2.0 is Google's latest, fastest AI model optimized for translation
// Reference: https://ai.google.dev/gemini-api/docs/models/gemini

// Language code mapping for Gemini API
// Using standard language codes
const LANGUAGE_CODES: Record<string, string> = {
  'zh-TW': 'zh-TW',  // Traditional Chinese
  'zh-CN': 'zh-CN',  // Simplified Chinese
  'en': 'en',        // English
  'es': 'es',        // Spanish
  'fr': 'fr',        // French
  'de': 'de',        // German
  'ja': 'ja',        // Japanese
  'ko': 'ko',        // Korean
};

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Fallback to free Google Translate if Gemini API key is not available
const USE_FALLBACK = !GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here';

/**
 * Translate text using Google Gemini Flash 2.0
 * @param text - Text to translate
 * @param targetLang - Target language code (e.g., 'zh-TW', 'es', 'fr')
 * @param sourceLang - Source language code (default: 'en')
 * @returns Translated text
 */
export async function translateText(
  text: string, 
  targetLang: string = 'zh-TW',
  sourceLang: string = 'en'
): Promise<string> {
  try {
    // Use fallback for missing API key
    if (USE_FALLBACK) {
      console.log('Using fallback translation (no Gemini API key)');
      return translateTextFallback(text, targetLang);
    }
    
    console.log('Using Gemini Flash 2.0 for translation');

    // Get language names for better prompts
    const targetLangName = getLanguageName(targetLang);
    const sourceLangName = getLanguageName(sourceLang);

    // Create prompt for Gemini
    const prompt = `Translate the following ${sourceLangName} text to ${targetLangName}. Only return the translation, no explanations:\n\n${text}`;

    // Call Google Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,  // Low temperature for more accurate translation
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      // If rate limited or error, fall back to free translation
      if (response.status === 429 || response.status === 503) {
        console.warn('Gemini API rate limited, using fallback');
        return translateTextFallback(text, targetLang);
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract translation from Gemini response
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    return text;
  } catch (error) {
    console.error('Gemini translation error:', error);
    // Fallback to simple translation
    return translateTextFallback(text, targetLang);
  }
}

/**
 * Get full language name from code
 */
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'zh-TW': 'Traditional Chinese',
    'zh-CN': 'Simplified Chinese',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean',
  };
  return names[code] || code;
}

/**
 * Fallback translation using free Google Translate API
 * Used when Hugging Face API key is not available
 */
async function translateTextFallback(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Fallback translation failed:', response.status);
      return text;
    }
    
    const data = await response.json();
    
    if (data && data[0]) {
      const translated = data[0].map((item: any) => item[0]).join('');
      console.log(`Translated: "${text.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
      return translated;
    }
    
    return text;
  } catch (error) {
    console.error('Fallback translation error:', error);
    return text;
  }
}

/**
 * Translate multiple texts in batch with rate limiting
 * @param texts - Array of texts to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code
 * @returns Array of translated texts
 */
export async function translateBatch(
  texts: string[], 
  targetLang: string = 'zh-TW',
  sourceLang: string = 'en'
): Promise<string[]> {
  const results: string[] = [];
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 3; // Smaller batches for Gemini
  const delay = USE_FALLBACK ? 100 : 300; // Gemini has generous rate limits but still be respectful
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    // Translate batch in parallel
    const batchResults = await Promise.all(
      batch.map(text => translateText(text, targetLang, sourceLang))
    );
    
    results.push(...batchResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Get list of supported languages
 * @returns Object mapping language codes to language names
 */
export function getSupportedLanguages(): Record<string, string> {
  return {
    'zh-TW': 'Traditional Chinese',
    'zh-CN': 'Simplified Chinese',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean',
  };
}
