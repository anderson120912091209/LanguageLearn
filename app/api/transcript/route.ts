import { NextRequest, NextResponse } from 'next/server';
import { getYoutubeTranscript } from '@/lib/youtube';
import { translateBatch } from '@/lib/translate';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching transcript for video: ${videoId}`);

    // Fetch transcript
    const transcript = await getYoutubeTranscript(videoId);
    console.log(`[API] Got ${transcript.length} transcript segments`);

    // Translate all segments
    const texts = transcript.map(segment => segment.text);
    console.log(`[API] Starting translation of ${texts.length} segments...`);
    
    const translations = await translateBatch(texts);
    console.log(`[API] Translation complete. Got ${translations.length} translations`);

    // Combine transcript with translations
    const result = transcript.map((segment, index) => ({
      ...segment,
      translation: translations[index],
    }));

    console.log(`[API] Returning ${result.length} segments with translations`);
    console.log(`[API] Sample: "${result[0]?.text}" -> "${result[0]?.translation}"`);

    return NextResponse.json({ transcript: result });
  } catch (error: any) {
    console.error('Transcript API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
