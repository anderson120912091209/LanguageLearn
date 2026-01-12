declare module 'youtube-transcript-api' {
  export interface TranscriptResponse {
    text: string;
    offset: number;
    duration: number;
  }

  export class YoutubeTranscript {
    static fetchTranscript(videoId: string, options?: { lang?: string }): Promise<TranscriptResponse[]>;
  }
}
