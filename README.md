# Language Learning Workspace

An interactive web application for learning English through YouTube videos with real-time translations and vocabulary tracking.

## Features

- 🎥 **YouTube Video Integration**: Paste any YouTube URL and watch with interactive transcripts
- 🌍 **Real-time Translation**: Automatic translation to Traditional Chinese (extensible to other languages)
- 📝 **Interactive Transcripts**: Click on any word in the transcript to save it to your vocabulary
- 📚 **Personal Dictionary**: Build your own vocabulary list from videos you watch
- 🎴 **Flashcard Mode**: Study your saved vocabulary with an interactive flashcard system
- 📊 **Export Data**: Export your vocabulary to CSV for use with other tools
- ⏱️ **Timestamp Sync**: Jump to specific moments in the video from transcript or vocabulary
- 🎯 **Context Learning**: Every word is saved with its context sentence and video timestamp

## Tech Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Translation**: Google Gemini Flash 2.0 (Latest, fastest AI model)
- **Transcripts**: [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api) (JavaScript port)
- **Video Player**: react-youtube

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- (Optional) Google Cloud account for official Translation API

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd LanguageLearn
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL commands from `SUPABASE_SCHEMA.md` in your Supabase SQL Editor
   - Get your project URL and anon key from Project Settings → API

4. (Optional) Get Google Gemini API key for AI-powered translations:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Get API Key" and create a new key
   - This enables Gemini Flash 2.0 for high-quality, fast translations

5. Create `.env.local` file:
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional (for AI-powered translations with Gemini Flash 2.0)
GEMINI_API_KEY=your-gemini-api-key-here
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

**Note**: Without a Gemini API key, the app falls back to free Google Translate. For best translation quality and speed, we recommend getting a free Gemini API key from Google AI Studio.

## Usage

### Basic Workflow

1. **Paste a YouTube URL**: On the home page, paste any YouTube video URL
2. **Watch & Learn**: The video will load with synchronized transcript and translations
3. **Save Vocabulary**: Select any word or phrase in the transcript to save it
4. **Review**: Switch to vocabulary view to see all saved words
5. **Study**: Use flashcard mode to practice your vocabulary
6. **Export**: Download your vocabulary as CSV for external tools

### Tips

- The transcript auto-scrolls to the current position in the video
- Click on any transcript segment to jump to that moment
- Click on vocabulary items to jump back to where you learned them
- Search your vocabulary to find specific words quickly

## Current Limitations & Future Enhancements

### Current Version

- Authenticated users store vocabulary in Supabase (persistent across devices)
- Uses Meta's NLLB model via Hugging Face (high-quality translation for 200+ languages)
- Falls back to free Google Translate if Hugging Face API key not provided
- Currently optimized for Traditional Chinese (easily extensible to other languages)
- Full authentication with Supabase Auth

### Planned Features

- [ ] User authentication with Supabase Auth
- [ ] Persistent vocabulary storage in Supabase
- [ ] Multiple target language support
- [ ] Spaced repetition algorithm for flashcards
- [ ] Audio pronunciation
- [ ] Example sentences for vocabulary
- [ ] Progress tracking and statistics
- [ ] Video history and bookmarks
- [ ] Custom word lists and categories
- [ ] Mobile app support

## Project Structure

```
LanguageLearn/
├── app/
│   ├── api/
│   │   └── transcript/
│   │       └── route.ts          # API endpoint for fetching transcripts
│   ├── workspace/
│   │   └── [videoId]/
│   │       └── page.tsx           # Main workspace page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Home page
├── components/
│   ├── TranscriptPanel.tsx        # Interactive transcript component
│   └── VocabularyPanel.tsx        # Vocabulary list and flashcards
├── lib/
│   ├── supabase.ts               # Supabase client and types
│   ├── translate.ts              # Translation utilities
│   └── youtube.ts                # YouTube transcript fetching
├── SUPABASE_SCHEMA.md            # Database schema documentation
└── README.md
```

## API Endpoints

### POST /api/transcript

Fetches and translates a YouTube video transcript.

**Request:**
```json
{
  "videoId": "dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "transcript": [
    {
      "text": "Hello world",
      "start": 0.5,
      "duration": 2.3,
      "translation": "你好世界"
    }
  ]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning and development.

## Support

For issues and questions, please open an issue on GitHub.
