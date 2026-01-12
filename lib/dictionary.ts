/**
 * Dictionary and word definition utilities
 * Uses Free Dictionary API for definitions
 */

export interface WordDefinition {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
  }[];
}

/**
 * Fetch word definition from Free Dictionary API
 * @param word - Word to look up
 * @returns Word definition or null if not found
 */
export async function fetchWordDefinition(word: string): Promise<WordDefinition | null> {
  try {
    const cleanWord = word.toLowerCase().trim();
    
    if (!cleanWord || cleanWord.length === 0) {
      return null;
    }
    
    console.log(`[Dictionary] Looking up: ${cleanWord}`);
    
    // Use Free Dictionary API (no key required)
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
    );
    
    if (!response.ok) {
      console.log(`[Dictionary] Word not found: ${cleanWord}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
    
    const entry = data[0];
    
    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
      meanings: entry.meanings?.map((m: any) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions?.slice(0, 3).map((d: any) => ({
          definition: d.definition,
          example: d.example,
          synonyms: d.synonyms?.slice(0, 5),
        })) || [],
      })) || [],
    };
  } catch (error) {
    console.error('[Dictionary] Error:', error);
    return null;
  }
}

/**
 * Get simple definition (first meaning only)
 * Useful for quick popups
 */
export async function getSimpleDefinition(word: string): Promise<string | null> {
  const def = await fetchWordDefinition(word);
  
  if (!def || !def.meanings || def.meanings.length === 0) {
    return null;
  }
  
  const firstMeaning = def.meanings[0];
  const firstDef = firstMeaning.definitions[0];
  
  return firstDef?.definition || null;
}
