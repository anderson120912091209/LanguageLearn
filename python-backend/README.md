# Python Transcript Service

This is a microservice that reliably fetches YouTube transcripts using the official `youtube-transcript-api` Python library.

## Why Python?

The Python `youtube-transcript-api` library is:
- ✅ **Most reliable** - Used by thousands of projects
- ✅ **Well maintained** - Active development
- ✅ **Works consistently** - No blocking issues
- ✅ **Official implementation** - Direct port of the reference implementation

## Quick Start

### 1. Install Python Requirements

```bash
cd python-backend
pip install -r requirements.txt
```

Or with virtual environment (recommended):

```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the Service

```bash
python app.py
```

The service will start on http://localhost:5001

**Note:** Changed from port 5000 to 5001 because macOS uses port 5000 for AirPlay Receiver.

### 3. Update Next.js to Use Python Service

The Next.js app will automatically use this service when it's running.

## API Endpoints

### GET /health
Health check

**Response:**
```json
{
  "status": "ok",
  "service": "YouTube Transcript Service"
}
```

### POST /transcript
Get video transcript

**Request:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "lang": "en"
}
```

**Response:**
```json
{
  "success": true,
  "transcript": [
    {
      "text": "We're no strangers to love",
      "offset": 0,
      "duration": 2500
    }
  ],
  "count": 150
}
```

## Testing

```bash
# Test health check
curl http://localhost:5001/health

# Test transcript fetch
curl -X POST http://localhost:5001/transcript \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ"}'
```

## Docker (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app.py .

CMD ["python", "app.py"]
```

Build and run:
```bash
docker build -t transcript-service .
docker run -p 5000:5000 transcript-service
```

## Production Deployment

Deploy to:
- **Heroku**: `heroku create && git push heroku main`
- **Railway**: Connect GitHub repo
- **Render**: Connect GitHub repo
- **AWS Lambda**: Use Zappa or Serverless

## Why This Works

The Python library:
1. Makes proper requests with correct headers
2. Handles YouTube's authentication gracefully
3. Parses the response correctly
4. Has been battle-tested by thousands of users
5. Actively maintained and updated

This is the INDUSTRY STANDARD approach!
