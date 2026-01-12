"""
YouTube Transcript Microservice
Uses the official youtube-transcript-api Python library
This is the MOST RELIABLE way to get transcripts
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'YouTube Transcript Service'})

@app.route('/transcript', methods=['POST'])
def get_transcript():
    """
    Fetch YouTube transcript with accurate timestamps
    
    Request body:
    {
        "videoId": "dQw4w9WgXcQ",
        "lang": "en"  # optional
    }
    
    Response:
    {
        "transcript": [
            {
                "text": "Hello world",
                "offset": 500,    # milliseconds
                "duration": 2000  # milliseconds
            }
        ]
    }
    """
    try:
        data = request.get_json()
        video_id = data.get('videoId')
        lang = data.get('lang', 'en')
        
        if not video_id:
            return jsonify({'error': 'videoId is required'}), 400
        
        print(f"[Python] Fetching transcript for video: {video_id}")
        
        # Create API instance
        api = YouTubeTranscriptApi()
        
        # Fetch transcript using the official library (v1.2.3+ API)
        # This is the correct method according to the docs
        transcript = api.fetch(video_id, languages=[lang, 'en'])
        
        print(f"[Python] Successfully fetched {len(transcript)} segments")
        
        # Convert to our format
        # The transcript is a FetchedTranscript object with snippets
        # Each snippet has: text, start, duration
        result = []
        for segment in transcript:
            # Handle both dict and object attribute access
            if hasattr(segment, 'text'):
                text = segment.text
                start = segment.start
                duration = segment.duration
            else:
                text = segment['text']
                start = segment['start']
                duration = segment['duration']
            
            result.append({
                'text': text,
                'offset': int(start * 1000),  # Convert to ms
                'duration': int(duration * 1000)  # Convert to ms
            })
        
        print(f"[Python] Sample segment: {result[0] if result else 'none'}")
        
        return jsonify({
            'success': True,
            'transcript': result,
            'count': len(result)
        })
        
    except TranscriptsDisabled:
        print(f"[Python] Transcripts disabled for video: {video_id}")
        return jsonify({
            'error': 'This video has transcripts disabled'
        }), 404
        
    except NoTranscriptFound:
        print(f"[Python] No transcript found for video: {video_id}")
        return jsonify({
            'error': 'No captions available for this video'
        }), 404
        
    except Exception as e:
        print(f"[Python] Error: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("YouTube Transcript Service Starting...")
    print("=" * 60)
    print("This service uses the official youtube-transcript-api")
    print("Python library - the MOST RELIABLE method available.")
    print("=" * 60)
    print("")
    print("Starting on http://localhost:8000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8000, debug=True)
