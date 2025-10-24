# SEO & Social Media Optimization Guide

## Overview

TranscriptAI now has comprehensive SEO and social media metadata configured for optimal sharing and discoverability.

---

## What Was Added

### 1. **Enhanced SEO Metadata**

**Basic SEO:**
- Dynamic page titles with template (`%s | TranscriptAI`)
- Comprehensive description (155 characters)
- 12 targeted keywords
- Author, creator, and publisher metadata
- Application category

**Robots & Indexing:**
- Full index and follow permissions
- Google-specific directives for rich snippets
- Max image and video preview permissions

### 2. **Open Graph Tags (LinkedIn, Facebook)**

```html
<meta property="og:type" content="website">
<meta property="og:title" content="TranscriptAI - AI-Powered YouTube Transcript Analysis">
<meta property="og:description" content="Transform YouTube videos...">
<meta property="og:url" content="https://transcriptai.conn.digital">
<meta property="og:site_name" content="TranscriptAI">
<meta property="og:image" content="https://transcriptai.conn.digital/android-chrome-512x512.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:locale" content="en_US">
```

**What this means:**
- When you share on LinkedIn, it shows a rich preview card
- Professional thumbnail with logo
- Proper title and description
- Click-through to your site

### 3. **Twitter Card Tags**

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="TranscriptAI - AI-Powered YouTube Transcript Analysis">
<meta name="twitter:description" content="Transform YouTube videos...">
<meta name="twitter:image" content="https://transcriptai.conn.digital/android-chrome-512x512.png">
<meta name="twitter:creator" content="@ConnDigital">
<meta name="twitter:site" content="@ConnDigital">
```

**What this means:**
- Rich preview cards on Twitter/X
- Large image format
- Attribution to @ConnDigital

### 4. **Structured Data (JSON-LD)**

Added Schema.org structured data for search engines:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TranscriptAI",
  "applicationCategory": "ProductivityApplication",
  "description": "...",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [...]
}
```

**What this means:**
- Google understands it's a free productivity app
- Can appear in rich search results
- Structured feature list for search engines

---

## How to Test Social Media Previews

### LinkedIn Preview

1. **LinkedIn Post Inspector** (Official):
   - Go to: https://www.linkedin.com/post-inspector/
   - Enter URL: `https://transcriptai.conn.digital`
   - Click "Inspect"
   - See preview card

2. **Manual Test**:
   - Create a new LinkedIn post
   - Paste URL: `https://transcriptai.conn.digital`
   - LinkedIn will fetch and show preview card
   - ✅ Should show logo, title, description

### Twitter/X Preview

1. **Twitter Card Validator**:
   - Go to: https://cards-dev.twitter.com/validator
   - Requires Twitter Developer account
   - Enter URL and see preview

2. **Manual Test**:
   - Create new tweet
   - Paste URL
   - Preview card appears automatically

### Facebook Preview

1. **Facebook Sharing Debugger** (Official):
   - Go to: https://developers.facebook.com/tools/debug/
   - Enter URL: `https://transcriptai.conn.digital`
   - Click "Debug"
   - See how Facebook renders it

2. **Clear Cache**:
   - Click "Scrape Again" to refresh Facebook's cache
   - Important after making metadata changes

### General OG Tag Tester

**OpenGraph.xyz**:
- Go to: https://www.opengraph.xyz/
- Enter URL: `https://transcriptai.conn.digital`
- See preview for multiple platforms at once

---

## Current Metadata Summary

| Property | Value |
|----------|-------|
| **Title** | TranscriptAI - AI-Powered YouTube Transcript Analysis |
| **Description** | Transform YouTube videos into actionable insights. Download transcripts instantly and analyze them with AI. Get summaries, extract code snippets, quotes, and action items from any YouTube video. Free during beta. |
| **URL** | https://transcriptai.conn.digital |
| **Image** | /android-chrome-512x512.png (512x512) |
| **Type** | website / WebApplication |
| **Locale** | en_US |
| **Twitter Handle** | @ConnDigital |

---

## SEO Keywords Targeted

1. YouTube transcript
2. video transcription
3. AI transcript analysis
4. YouTube summary
5. video to text
6. transcript download
7. AI summarization
8. code extraction
9. video analysis
10. content extraction
11. YouTube captions
12. subtitle download

---

## Recommended: Create Custom OG Image

**Current**: Using 512x512 logo (works but not ideal)

**Ideal OG Image Specs**:
- **Size**: 1200x630 pixels
- **Format**: PNG or JPG
- **Max file size**: 8 MB
- **Aspect ratio**: 1.91:1

**Suggested Design**:
```
┌─────────────────────────────────┐
│  [Logo]  TranscriptAI           │
│                                  │
│  AI-Powered YouTube              │
│  Transcript Analysis             │
│                                  │
│  ✓ Download Transcripts          │
│  ✓ AI Summaries                  │
│  ✓ Extract Code & Quotes         │
│                                  │
│  Free During Beta                │
│  transcriptai.conn.digital       │
└─────────────────────────────────┘
```

**Tools to Create**:
- Figma (https://figma.com)
- Canva (https://canva.com)
- Photoshop
- Online OG image generators

**Once created**:
1. Save as `/frontend/public/og-image.png`
2. Update `layout.tsx`:
   ```typescript
   images: [
     {
       url: `${siteUrl}/og-image.png`,
       width: 1200,
       height: 630,
       alt: "TranscriptAI - AI-Powered YouTube Transcript Analysis",
     },
   ],
   ```

---

## Environment Variables

### Frontend (.env.local)

```bash
# Site URL for SEO and social media metadata
NEXT_PUBLIC_SITE_URL=https://transcriptai.conn.digital

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Production Deployment

Make sure to set `NEXT_PUBLIC_SITE_URL` in your production environment:

**CapRover/Docker**:
```bash
NEXT_PUBLIC_SITE_URL=https://transcriptai.conn.digital
```

**Vercel/Netlify**:
- Add as environment variable in dashboard
- Rebuild to apply

---

## LinkedIn Sharing Best Practices

### 1. **First Post Template**

```
🚀 Excited to share TranscriptAI - a new free tool I built for analyzing YouTube content with AI

Ever wished you could:
• Download YouTube transcripts instantly
• Get AI-generated summaries
• Extract code snippets automatically
• Pull out key quotes and action items

Now you can, without any sign-up required.

Built with Next.js 15, Go, and AI (OpenAI GPT-4, Google Gemini, Anthropic Claude).

Try it out: https://transcriptai.conn.digital

What do you think? Would love your feedback! 💬

#AI #Productivity #YouTube #OpenSource #WebDev
```

### 2. **Feature Highlight Post**

```
Here's what makes TranscriptAI different:

✅ No sign-up required
✅ Completely free during beta
✅ Multiple AI models (GPT-4, Gemini, Claude)
✅ Export in TXT, JSON, MD, CSV
✅ Q&A with your transcripts
✅ Code extraction from coding tutorials

Perfect for:
• Students reviewing lectures
• Developers learning from tutorials
• Researchers analyzing interviews
• Content creators studying competitors

Check it out: https://transcriptai.conn.digital

#ProductivityTools #AITools #TranscriptAnalysis
```

### 3. **Use Case Post**

```
Just used TranscriptAI to:

1️⃣ Download a 2-hour coding tutorial transcript
2️⃣ Get an AI summary in 30 seconds
3️⃣ Extract all code snippets automatically
4️⃣ Export everything to Markdown

What used to take me hours now takes minutes.

Try it: https://transcriptai.conn.digital

What would you use it for?

#DeveloperTools #LearningInPublic #Coding
```

---

## Monitoring SEO Performance

### Google Search Console

1. **Add Property**: https://search.google.com/search-console
2. **Verify Ownership**:
   - Add verification meta tag to `layout.tsx`
   - Or use DNS verification
3. **Submit Sitemap**:
   - Generate sitemap: https://transcriptai.conn.digital/sitemap.xml
   - Submit to Google

### Analytics

Consider adding:
- **Google Analytics 4**: Track visitors and behavior
- **Plausible**: Privacy-friendly alternative
- **Umami**: Self-hosted analytics

---

## Next Steps

### Immediate (Recommended)

1. ✅ Test preview on LinkedIn Post Inspector
2. ✅ Share on your personal LinkedIn
3. ✅ Test preview on Facebook Debugger
4. ⬜ Create custom 1200x630 OG image
5. ⬜ Set up Google Search Console
6. ⬜ Submit sitemap to Google

### Future Enhancements

1. **Create OG images for each page**:
   - Home page (done)
   - About page
   - Pricing page
   - How to Use page

2. **Add more structured data**:
   - FAQ schema for FAQ section
   - VideoObject schema for tutorial videos
   - BreadcrumbList for navigation

3. **Localization**:
   - Add alternate language tags
   - Create translations
   - Multi-region targeting

4. **Performance**:
   - Optimize OG image size
   - Use WebP for faster loading
   - CDN for images

---

## Verification Checklist

Before sharing publicly:

- [x] Open Graph tags added
- [x] Twitter Card tags added
- [x] Structured data (JSON-LD) added
- [x] SEO keywords defined
- [x] Canonical URL set
- [x] Robots.txt allows indexing
- [x] Sitemap.xml exists
- [ ] OG image is 1200x630 (recommended)
- [ ] Test on LinkedIn Post Inspector
- [ ] Test on Facebook Debugger
- [ ] Google Search Console verified
- [ ] Analytics installed (optional)

---

## Support

If preview cards aren't showing:

1. **Clear cache** on the platform (use debugging tools)
2. **Wait 5-10 minutes** for platforms to refresh
3. **Check network** - make sure URL is publicly accessible
4. **Verify deployment** - changes must be live in production

**Need help?** Check the Next.js metadata docs:
https://nextjs.org/docs/app/building-your-application/optimizing/metadata

---

**Last Updated**: 2025-10-24
**Created By**: Conn.Digital
