declare module 'youtube-captions-scraper' {
  export interface Caption {
    start: number;
    dur: number;
    text: string;
  }

  export interface GetSubtitlesOptions {
    videoID: string;
    lang?: string;
  }

  export function getSubtitles(options: GetSubtitlesOptions): Promise<Caption[]>;
}
