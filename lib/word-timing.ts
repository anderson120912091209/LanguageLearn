/**
 * Word-level timing utilities
 * Estimates individual word timestamps from segment-level timestamps
 */

import { TranscriptSegment } from './youtube';

export interface WordTimestamp {
  word: string;
  start: number;      // Start time in seconds
  end: number;        // End time in seconds
  segmentIndex: number; // Which segment this word belongs to
  wordIndex: number;    // Index within the segment
}

/**
 * Split a transcript segment into words with estimated timestamps
 * 
 * Algorithm:
 * 1. Split text into words
 * 2. Calculate average time per word in segment
 * 3. Assign proportional time to each word based on length
 * 
 * @param segment - The transcript segment
 * @param segmentIndex - Index of this segment
 * @returns Array of words with timestamps
 */
export function estimateWordTimings(
  segment: TranscriptSegment,
  segmentIndex: number
): WordTimestamp[] {
  // Remove special characters and split into words
  const text = segment.text;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) {
    return [];
  }
  
  // Simple approach: Divide segment duration equally among words
  const timePerWord = segment.duration / words.length;
  
  const wordTimestamps: WordTimestamp[] = [];
  let currentTime = segment.start;
  
  words.forEach((word, index) => {
    // Calculate word timing based on character length (longer words = more time)
    const wordLength = word.length;
    const avgWordLength = text.length / words.length;
    const lengthFactor = wordLength / avgWordLength;
    
    // Adjust time allocation based on word length
    const wordDuration = timePerWord * lengthFactor;
    
    wordTimestamps.push({
      word: word,
      start: currentTime,
      end: currentTime + wordDuration,
      segmentIndex,
      wordIndex: index,
    });
    
    currentTime += wordDuration;
  });
  
  return wordTimestamps;
}

/**
 * Convert entire transcript to word-level timestamps
 * @param transcript - Array of transcript segments
 * @returns Flattened array of all words with timestamps
 */
export function generateWordTimestamps(
  transcript: TranscriptSegment[]
): WordTimestamp[] {
  const allWords: WordTimestamp[] = [];
  
  transcript.forEach((segment, index) => {
    const words = estimateWordTimings(segment, index);
    allWords.push(...words);
  });
  
  return allWords;
}

/**
 * Find the currently active word based on playback time
 * @param words - Array of word timestamps
 * @param currentTime - Current video playback time in seconds
 * @returns Index of active word, or -1 if none
 */
export function findActiveWord(
  words: WordTimestamp[],
  currentTime: number
): number {
  return words.findIndex(
    word => currentTime >= word.start && currentTime < word.end
  );
}

/**
 * Clean word for dictionary lookup (remove punctuation)
 * @param word - Raw word from transcript
 * @returns Cleaned word
 */
export function cleanWord(word: string): string {
  return word
    .replace(/[♪\[\]().,!?;:'"]/g, '') // Remove common punctuation
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
