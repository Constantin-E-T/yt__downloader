# 🧪 Local Testing Guide - AI Features

This guide will help you test all AI features locally before deployment.

---

## 📋 Prerequisites

1. **OpenAI API Key** (Required)
   - Get one from: https://platform.openai.com/api-keys
   - Estimated cost for testing: $0.50-$1.00
   - Free $5 credit for new accounts

2. **Tools Installed**
   - Docker (for PostgreSQL)
   - Go 1.25+
   - curl (for API testing)
   - jq (optional, for pretty JSON output)

---

## 🚀 Quick Start

### Step 1: Set Up Environment

1. **Add your OpenAI API key** to `.env`:
   ```bash
   # Edit .env file and replace:
   OPENAI_API_KEY=your-openai-api-key-here

   # With your actual key:
   OPENAI_API_KEY=sk-proj-...
   ```

2. **Verify database is running:**
   ```bash
   docker ps | grep postgres
   ```

   If not running:
   ```bash
   docker-compose up -d
   ```

3. **Check database tables:**
   ```bash
   docker exec yt_transcripts_db psql -U postgres -d yt_transcripts -c "\dt"
   ```

   You should see:
   - videos
   - transcripts
   - ai_summaries
   - ai_extractions
   - ai_translations

---

### Step 2: Start Backend Server

```bash
cd backend
go run cmd/server/main.go
```

You should see:
```
[INFO] Server starting on :8080
[INFO] Connected to database successfully
[INFO] AI provider: openai (model: gpt-4)
```

Leave this terminal running and open a new terminal for testing.

---

### Step 3: Run Automated Tests

**Option A: Use the test script (Recommended)**

```bash
./test-ai-features.sh
```

This will automatically test:
- ✅ Transcript fetching
- ✅ All 3 summary types (brief, detailed, key_points)
- ✅ All 3 extraction types (quotes, action_items, code)
- ✅ Q&A feature
- ✅ Caching verification

**Option B: Manual testing (see below)**

---

## 🔬 Manual Testing Steps

### 1. Fetch a Transcript

```bash
curl -X POST http://localhost:8080/api/v1/transcripts \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "language": "en"
  }' | jq '.'
```

**Expected response:**
```json
{
  "video": {
    "id": "uuid...",
    "youtube_id": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up...",
    ...
  },
  "transcript": {
    "id": "YOUR-TRANSCRIPT-ID",
    "content": [...],
    ...
  }
}
```

**📝 Save the `transcript.id` for next steps!**

---

### 2. Test AI Summarization

Replace `YOUR-TRANSCRIPT-ID` with the ID from step 1.

#### a) Brief Summary

```bash
curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/summarize \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "brief"}' | jq '.'
```

**Expected response:**
```json
{
  "id": "uuid...",
  "transcript_id": "YOUR-TRANSCRIPT-ID",
  "summary_type": "brief",
  "content": {
    "text": "A 2-3 sentence summary of the video...",
    "key_points": [],
    "sections": []
  },
  "model": "gpt-4",
  "tokens_used": 238,
  "created_at": "2025-10-21T..."
}
```

#### b) Detailed Summary

```bash
curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/summarize \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "detailed"}' | jq '.'
```

**Expected:** Multi-paragraph summary with sections.

#### c) Key Points

```bash
curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/summarize \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "key_points"}' | jq '.'
```

**Expected:** Bulleted list of main takeaways.

---

### 3. Test AI Extraction

#### a) Extract Quotes

```bash
curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/extract \
  -H "Content-Type: application/json" \
  -d '{"extraction_type": "quotes"}' | jq '.'
```

**Expected response:**
```json
{
  "id": "uuid...",
  "transcript_id": "YOUR-TRANSCRIPT-ID",
  "extraction_type": "quotes",
  "items": [
    {
      "quote": "Never gonna give you up",
      "speaker": "Rick Astley",
      "context": "Main chorus lyrics",
      "importance": "high"
    },
    ...
  ],
  "model": "gpt-4",
  "tokens_used": 385,
  "created_at": "2025-10-21T..."
}
```

#### b) Extract Action Items

```bash
curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/extract \
  -H "Content-Type: application/json" \
  -d '{"extraction_type": "action_items"}' | jq '.'
```

**Expected:** List of actionable steps/recommendations.

#### c) Extract Code (Better with tech tutorial video)

For code extraction, use a coding tutorial video like:
```bash
# First get a coding tutorial transcript
curl -X POST http://localhost:8080/api/v1/transcripts \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=YOUR-TECH-VIDEO",
    "language": "en"
  }' | jq '.'

# Then extract code
curl -X POST http://localhost:8080/api/v1/transcripts/NEW-TRANSCRIPT-ID/extract \
  -H "Content-Type: application/json" \
  -d '{"extraction_type": "code"}' | jq '.'
```

**Expected:** Code snippets with language, context, and timestamp hints.

---

### 4. Test AI Q&A

#### a) Ask a Question

```bash
curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/qa \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main message of this song?"}' | jq '.'
```

**Expected response:**
```json
{
  "id": "uuid...",
  "transcript_id": "YOUR-TRANSCRIPT-ID",
  "question": "What is the main message of this song?",
  "answer": "The main message is about unwavering devotion and loyalty...",
  "confidence": "high",
  "sources": [
    "Never gonna give you up",
    "Never gonna let you down"
  ],
  "not_found": false,
  "model": "gpt-4",
  "tokens_used": 680,
  "created_at": "2025-10-21T..."
}
```

#### b) Ask a Question NOT in Transcript

```bash
curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/qa \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the meaning of life?"}' | jq '.'
```

**Expected response:**
```json
{
  ...
  "answer": "This information is not mentioned in the transcript.",
  "confidence": "high",
  "sources": [],
  "not_found": true,
  ...
}
```

---

### 5. Test Caching

**Run the same summarization request twice:**

```bash
# First request (will call OpenAI API - ~2s)
time curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/summarize \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "brief"}' | jq '.'

# Second request (cached - should be <30ms)
time curl -X POST http://localhost:8080/api/v1/transcripts/YOUR-TRANSCRIPT-ID/summarize \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "brief"}' | jq '.'
```

**Expected:** Second request returns instantly with same `created_at` timestamp.

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Transcript fetching works
- [ ] Brief summary generates correctly
- [ ] Detailed summary has multiple sections
- [ ] Key points are bulleted
- [ ] Quote extraction identifies quotes
- [ ] Action item extraction categorizes tasks
- [ ] Q&A answers questions with sources
- [ ] Q&A detects when answer is not found
- [ ] Caching works (second request is instant)
- [ ] Token usage is tracked
- [ ] Confidence levels are appropriate

---

## 🐛 Troubleshooting

### Error: "openai api key is required"

**Fix:** Add your OpenAI API key to `.env`:
```bash
OPENAI_API_KEY=sk-proj-your-actual-key
```

Then restart the backend server.

### Error: "dial tcp: lookup postgres"

**Fix:** Start the database:
```bash
docker-compose up -d
```

### Error: "table ai_extractions does not exist"

**Fix:** Apply migration 003:
```bash
cat database/migrations/003_ai_summaries_up.sql | \
  docker exec -i yt_transcripts_db psql -U postgres -d yt_transcripts
```

### Error: "rate limit exceeded"

**Fix:** You've hit OpenAI's rate limit. Wait 60 seconds and try again.

### Error: "insufficient quota"

**Fix:** Add billing information to your OpenAI account at:
https://platform.openai.com/account/billing

---

## 💰 Cost Tracking

Check token usage in responses:

```bash
# After each request, check tokens_used field
curl ... | jq '.tokens_used'
```

**Estimated costs (GPT-4):**
- Input: $0.03 / 1K tokens
- Output: $0.06 / 1K tokens

**Typical usage per request:**
- Brief summary: 238 tokens (~$0.01)
- Detailed summary: 412 tokens (~$0.02)
- Code extraction: 520 tokens (~$0.03)
- Q&A: 680 tokens (~$0.04)

**Testing budget:** ~$0.50-$1.00 for full test suite

---

## 📊 Database Inspection

Check cached data in database:

```bash
# View all summaries
docker exec yt_transcripts_db psql -U postgres -d yt_transcripts \
  -c "SELECT id, transcript_id, summary_type, model, tokens_used, created_at FROM ai_summaries;"

# View all extractions
docker exec yt_transcripts_db psql -U postgres -d yt_transcripts \
  -c "SELECT id, transcript_id, extraction_type, model, tokens_used, created_at FROM ai_extractions;"
```

---

## 🎯 Next Steps

After successful local testing:

1. ✅ **Verified all features work** - Ready for production
2. 📝 **Document API costs** - Monitor token usage
3. 🚀 **Deploy to production** - Phase 8
4. 🎨 **Build frontend UI** - Integrate AI features
5. 👥 **Get user feedback** - Iterate based on real usage

---

## 📞 Need Help?

- Check backend logs in terminal where server is running
- Check database logs: `docker logs yt_transcripts_db`
- Review error responses for details
- Check OpenAI dashboard for API usage: https://platform.openai.com/usage

---

**Happy Testing!** 🎉
