# Building TranscriptAI: Turn YouTube Videos into Actionable Insights

**By Conn.Digital** | October 2025

---

## The Problem

Ever found yourself 45 minutes into a 2-hour tutorial, desperately trying to find that one code snippet? You scrub through the timeline, rewatch sections, and waste valuable time.

YouTube's transcript feature exists, but it's basic—just raw text with timestamps. No intelligence, no analysis, no real utility.

That's the gap **TranscriptAI** fills.

---

## What We Built

**TranscriptAI** (https://transcriptai.conn.digital) is a free platform that transforms YouTube videos into actionable insights:

- 📝 Download transcripts instantly
- 🤖 Generate AI summaries (brief, detailed, or key points)
- 💻 Extract code snippets automatically
- 💬 Pull important quotes with context
- ✅ Identify action items from videos
- 🔍 Ask questions about content without watching

---

## The Stack

We kept it simple but powerful:

**Frontend:** Next.js 15, TypeScript, Tailwind CSS
**Backend:** Go, PostgreSQL
**AI:** Google Gemini (with fallback providers)
**Deployment:** Self-hosted infrastructure

Why these choices?

- **Next.js 15:** Server-side rendering, great developer experience
- **Go:** Fast, reliable, handles concurrency beautifully
- **PostgreSQL:** Proven database, excellent indexing
- **Gemini:** 90% cheaper than GPT-4, still great quality

---

## Key Technical Decisions

### 1. Hiding Backend Infrastructure

One problem stood out early: if the browser talks directly to our backend, the infrastructure becomes visible. Anyone can see our API endpoints in DevTools.

**Solution:** Server-side proxy with Next.js API routes.

The browser only sees `/api/transcripts/*`. Behind the scenes, Next.js forwards requests to our Go backend. Simple, secure, professional.

### 2. Smart Caching

AI calls are expensive. Process the same video twice? That's wasted money.

We cache everything:
- First request: Fetch from YouTube, process with AI, store in PostgreSQL
- Future requests: Instant retrieval from database

Result: 95% cache hit rate. Responses under 30ms for cached content.

### 3. Database Indexing

Early on, queries were slow (~15ms). Not terrible, but not great.

Added strategic indexes on frequently queried columns. Query time dropped to ~0.74ms. **10x speedup with a few lines of SQL.**

### 4. AI Cost Optimization

Started with GPT-4. Quality was excellent. Cost was scary.

Switched to Google Gemini 2.5 Flash:
- **Cost:** $0.001 per request (vs $0.01 for GPT-4)
- **Speed:** 1-2 seconds average
- **Quality:** Excellent for our use case

Built a multi-provider interface so we can switch between OpenAI, Anthropic, and Google. No vendor lock-in.

---

## The Numbers

After 5 weeks of development:

**Performance:**
- 1-2 seconds for 40-minute videos
- 95% cache hit rate
- Sub-second responses for cached content

**Code Quality:**
- Zero TypeScript errors
- Zero ESLint warnings
- 85%+ test coverage

**Cost:**
- ~$20/month operating cost
- Scales to thousands of users on same budget

---

## What We Learned

### Next.js 15 Breaking Changes

Next.js 15 made params async. What used to be synchronous object destructuring now requires awaiting a Promise.

Updated 5 API routes. Worth it for the new features.

### AI Provider Selection Matters

Don't lock yourself to one provider. Build abstractions. We can swap AI backends with an environment variable change.

### Cache Everything You Can

AI is expensive. Network requests are expensive. Database queries are cheap (especially with indexes).

Process once, retrieve instantly.

### Performance is User Experience

Nobody wants to wait. 1-2 second response times feel instant. 10 seconds feels broken.

We obsessed over speed. Users notice.

---

## Real-World Use Cases

**For Developers:**
Extract code snippets from tutorials without watching the entire video.

**For Researchers:**
Get summaries before committing to hour-long lectures.

**For Teams:**
Pull action items from recorded meetings automatically.

**For Students:**
Generate study notes from educational content.

---

## What's Next

We're just getting started:

**Short-term:**
- Multi-language support
- Video chapter detection
- Browser extension

**Mid-term:**
- User accounts and saved transcripts
- Batch processing
- API for developers

**Long-term:**
- Mobile apps
- Team collaboration features
- Advanced analytics

---

## Try It

**Live:** https://transcriptai.conn.digital
**Free during beta.** No sign-up required.

Paste a YouTube URL, get instant insights.

---

## Why We Built This

At Conn.Digital, we believe good tools should be accessible. Not hidden behind paywalls, not limited by artificial restrictions.

TranscriptAI is our answer to a problem we faced daily. If it helps you too, we've succeeded.

---

## Get in Touch

Questions? Feedback? Just want to chat about the tech?

**Website:** https://conn.digital
**Email:** emilian@conn.digital

We'd love to hear from you.

---

**Tags:** #AI #WebDevelopment #NextJS #Golang #ProductDevelopment

---

*Published by Conn.Digital | October 2025*
*Read time: 5 minutes*
