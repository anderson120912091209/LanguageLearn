/**
 * Transcript segment with accurate timestamps
 * Based on youtube-transcript-api structure
 * Reference: https://github.com/jdepoix/youtube-transcript-api
 */
export interface TranscriptSegment {
  text: string;          // The transcript text
  start: number;         // Start time in seconds (accurate timestamp)
  duration: number;      // Duration of the segment in seconds
  offset?: number;       // Original offset in milliseconds (preserved for accuracy)
  translation?: string;  // Translated text (added by API route)
}

/**
 * Fetch transcript from Python microservice (most reliable)
 */
async function fetchFromPythonService(videoId: string): Promise<any[]> {
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  
  try {
    console.log(`[YouTube] Trying Python service at ${pythonServiceUrl}...`);
    
    const response = await fetch(`${pythonServiceUrl}/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Python service error');
    }
    
    const data = await response.json();
    console.log(`[YouTube Python] Got ${data.transcript?.length || 0} segments`);
    return data.transcript || [];
  } catch (error) {
    console.log(`[YouTube Python] Service not available:`, (error as Error).message);
    throw error;
  }
}

/**
 * Simple and reliable YouTube transcript fetcher (fallback)
 * Downloads captions directly from YouTube's public caption URLs
 */
async function fetchYoutubeTranscriptRaw(videoId: string): Promise<any[]> {
  try {
    console.log(`[YouTube] Fetching video page for ID: ${videoId}`);
    
    // Fetch the video page
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
    }
    
    const html = await pageResponse.text();
    
    // Extract the player response - look for ytInitialPlayerResponse
    let playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    
    if (!playerResponseMatch) {
      // Try alternative pattern
      playerResponseMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});/);
    }
    
    if (!playerResponseMatch) {
      console.error('[YouTube] Could not find ytInitialPlayerResponse');
      console.log('[YouTube] HTML sample:', html.substring(0, 1000));
      throw new Error('Could not find player data in video page');
    }
    
    console.log(`[YouTube] Found player response (${playerResponseMatch[1].length} chars)`);
    
    // Parse the entire player response
    let playerResponse;
    try {
      playerResponse = JSON.parse(playerResponseMatch[1]);
    } catch (parseError) {
      console.error('[YouTube] Failed to parse player response:', parseError);
      throw new Error('Failed to parse video data');
    }
    
    // Navigate to caption tracks
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    console.log('[YouTube] Caption tracks found:', captionTracks?.length || 0);
    
    if (!captionTracks || captionTracks.length === 0) {
      console.error('[YouTube] No caption tracks. Player response keys:', Object.keys(playerResponse));
      console.error('[YouTube] Captions object:', JSON.stringify(playerResponse?.captions, null, 2));
      throw new Error('No captions available for this video');
    }
    
    const captionsData = captionTracks;
    
    if (!captionsData || captionsData.length === 0) {
      throw new Error('No captions available for this video');
    }
    
    // Get the first caption track (usually English or auto-generated)
    const captionTrack = captionsData[0];
    const captionUrl = captionTrack.baseUrl;
    
    console.log(`[YouTube] Found caption track, fetching XML...`);
    
    // Fetch the caption XML
    const captionResponse = await fetch(captionUrl);
    
    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
    }
    
    const xmlText = await captionResponse.text();
    console.log(`[YouTube] Got XML (${xmlText.length} chars)`);
    
    // Parse XML to extract text segments with timestamps
    const segments: any[] = [];
    const regex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    let match;
    
    while ((match = regex.exec(xmlText)) !== null) {
      const text = match[3]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
      
      if (text) {
        segments.push({
          text,
          offset: parseFloat(match[1]) * 1000,  // Convert to ms
          duration: parseFloat(match[2]) * 1000, // Convert to ms
        });
      }
    }
    
    console.log(`[YouTube] Extracted ${segments.length} segments`);
    return segments;
  } catch (error) {
    console.error('[YouTube] Error in fetchYoutubeTranscriptRaw:', error);
    throw error;
  }
}


/**
 * Fetch YouTube video transcript with accurate timestamps
 * Uses the youtube-transcript library (JavaScript port of youtube-transcript-api)
 * 
 * The library returns:
 * - text: The transcript text
 * - offset: Start time in milliseconds (accurate to the millisecond)
 * - duration: Duration in milliseconds
 * 
 * We preserve both millisecond precision (offset) and second precision (start)
 * for maximum flexibility in the UI
 * 
 * @param videoId - YouTube video ID
 * @param languageCode - Optional language code (e.g., 'en', 'es')
 * @returns Array of transcript segments with timestamps
 */
export async function getYoutubeTranscript(
  videoId: string,
  languageCode?: string  
): Promise<TranscriptSegment[]> {
  try {
    console.log(`[YouTube] Starting transcript fetch for video: ${videoId}`);
    
    let transcript: any[] = [];
    
    // Try Python service first (most reliable)
    try {
      transcript = await fetchFromPythonService(videoId);
    } catch (pythonError) {
      console.log('[YouTube] Python service not available, trying direct method...');
      // Fall back to direct HTTP method
      transcript = await fetchYoutubeTranscriptRaw(videoId);
    }
    
    console.log(`[YouTube] Got ${transcript?.length || 0} raw segments`);
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript data returned. Video may not have captions.');
    }
    
    console.log(`[YouTube] Sample raw segment:`, transcript[0]);
    
    // Map to our TranscriptSegment interface
    const result: TranscriptSegment[] = transcript.map((segment: any) => {
      const startMs = segment.offset || 0;
      const durationMs = segment.duration || 2000;
      const text = segment.text || '';
      
      return {
        text: String(text).trim(),
        start: startMs / 1000,           // Convert ms to seconds
        duration: durationMs / 1000,     // Convert ms to seconds
        offset: startMs,                  // Preserve milliseconds
      };
    }).filter((seg: TranscriptSegment) => seg.text.length > 0);
    
    console.log(`[YouTube] Successfully processed ${result.length} segments`);
    console.log(`[YouTube] First segment:`, JSON.stringify(result[0], null, 2));
    
    if (result.length === 0) {
      throw new Error('No valid transcript segments after filtering');
    }
    
    return result;
  } catch (error) {
    console.error('[YouTube] Full error:', error);
    
    const errorMessage = (error as Error).message;
    
    // Provide user-friendly error messages
    if (errorMessage.includes('No caption') || errorMessage.includes('captions data')) {
      throw new Error(
        'This video does not have captions available. ' +
        'Please try a video with the CC (closed captions) icon on YouTube.'
      );
    }
    
    if (errorMessage.includes('Failed to fetch video page')) {
      throw new Error(
        'Unable to access YouTube. Please check your internet connection.'
      );
    }
    
    // Generic error with more details
    throw new Error(
      'Failed to fetch transcript: ' + errorMessage
    );
  }
}

/**
 * Get available transcript languages for a video
 * @param videoId - YouTube video ID
 * @returns Array of available language codes
 */
export async function getAvailableTranscriptLanguages(videoId: string): Promise<string[]> {
  // For now, return a standard list
  // In the future, we can parse available caption tracks from the video page
  return ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-TW', 'zh-CN'];
}

/**
 * Format timestamp for display (MM:SS or HH:MM:SS)
 * @param seconds - Time in seconds
 * @returns Formatted timestamp string
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
