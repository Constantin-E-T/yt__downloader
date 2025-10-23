# TranscriptAI - Branding & Legal Update Summary

## Platform Identity

### Brand Name

**TranscriptAI** - operated by **Conn.Digital**

### Domain Structure

- **Primary Domain**: `conn.digital`
- **Service Subdomain**: `transcriptai.conn.digital`
- **Operator**: Constantin Emilian Tivlica (Conn.Digital)
- **Location**: Portsmouth, United Kingdom

---

## What Was Updated

### ✅ Branding Changes

All instances of "YT Transcript Downloader" have been replaced with "TranscriptAI":

1. **Main Layout** (`frontend/src/app/layout.tsx`)
   - Updated page title and meta description
   - Added "By Conn.Digital" to description

2. **Homepage** (`frontend/src/app/page.tsx`)
   - Updated metadata with new branding

3. **Navbar** (`frontend/src/components/navbar.tsx`)
   - Logo text changed to "TranscriptAI"

4. **Footer** (`frontend/src/components/footer.tsx`)
   - Brand name updated to "TranscriptAI"
   - Added "by Conn.Digital" attribution with link to conn.digital
   - Added working links to Privacy Policy and Terms of Service
   - Updated social links with your actual GitHub and LinkedIn profiles
   - Removed Twitter, kept GitHub and LinkedIn
   - Copyright notice updated

5. **About Page** (`frontend/src/app/about/page.tsx`)
   - Updated metadata

6. **Pricing Page** (`frontend/src/app/pricing/page.tsx`)
   - Updated metadata

7. **How to Use Page** (`frontend/src/app/how-to-use/page.tsx`)
   - Updated metadata

---

### ✅ Legal Documents Created

#### 1. Privacy Policy (`frontend/src/app/privacy/page.tsx`)

Comprehensive privacy policy covering:

- **Information Collection**: What data is collected (URLs, AI prompts, usage data, IP addresses, cookies)
- **Data Usage**: How data is used (service provision, improvements, security, rate limiting)
- **Storage & Security**:
  - Transcripts cached 7-30 days
  - AI summaries stored 30 days
  - Usage logs 90 days
  - HTTPS/TLS encryption, encrypted database, security audits
- **Third-Party Services**: OpenAI, Anthropic, Google Gemini, YouTube API
- **User Rights**: Access, deletion, correction, portability, opt-out
- **GDPR Compliance**: For European users
- **Contact Information**:
  - <contact@conn.digital>
  - <privacy@conn.digital>
  - <dpo@conn.digital> (Data Protection Officer)

#### 2. Terms of Service (`frontend/src/app/terms/page.tsx`)

Detailed terms including:

- **Service Description**: What TranscriptAI provides
- **Beta Notice**: Service in beta, features may change, no guarantee of continued free access
- **Acceptable Use**: What users are allowed to do
- **Prohibited Use**: Clear list of 8 prohibited activities
- **Intellectual Property**: Rights for our content, third-party content, and user content
- **Disclaimer of Warranties**: "AS IS" service disclaimer
- **Limitation of Liability**: Legal protections for Conn.Digital
- **Third-Party Services**: Links to YouTube, OpenAI, Anthropic, Google ToS
- **Termination**: Right to terminate service for violations
- **Governing Law**: England and Wales, United Kingdom
- **Contact Information**:
  - <contact@conn.digital>
  - <legal@conn.digital>

---

## Contact Emails Established

| Purpose | Email Address |
|---------|--------------|
| General Contact | <contact@conn.digital> |
| Privacy Inquiries | <privacy@conn.digital> |
| Data Protection | <dpo@conn.digital> |
| Legal Matters | <legal@conn.digital> |

---

## Social Media Links

- **GitHub**: <https://github.com/Constantin-E-T>
- **LinkedIn**: <https://uk.linkedin.com/in/constantin-emilian-tivlica-00a354206>
- **Portfolio**: <https://conn.digital>

---

## Next Steps (Optional)

### Domain Configuration

1. Set up subdomain `transcriptai.conn.digital` pointing to your hosting
2. Configure SSL certificate for the subdomain
3. Update any environment variables with production domain

### Email Configuration

Ensure these email addresses are set up and forwarding correctly:

- <contact@conn.digital> ✓ (you likely have this)
- <privacy@conn.digital>
- <dpo@conn.digital>
- <legal@conn.digital>

### Future Enhancements

1. Add cookie consent banner (mentioned in Privacy Policy)
2. Create a dedicated `/cookies` page
3. Add newsletter signup (if desired)
4. Consider adding a blog section
5. Add user analytics (Google Analytics/Plausible) with proper consent

---

## File Structure

```
frontend/src/app/
├── layout.tsx (✓ Updated)
├── page.tsx (✓ Updated)
├── about/page.tsx (✓ Updated)
├── pricing/page.tsx (✓ Updated)
├── how-to-use/page.tsx (✓ Updated)
├── privacy/
│   └── page.tsx (✓ NEW)
└── terms/
    └── page.tsx (✓ NEW)

frontend/src/components/
├── navbar.tsx (✓ Updated)
└── footer.tsx (✓ Updated)
```

---

## Legal Compliance Checklist

- ✅ Privacy Policy created and accessible
- ✅ Terms of Service created and accessible
- ✅ GDPR compliance section added
- ✅ Data retention policies documented
- ✅ Third-party service disclosures included
- ✅ User rights clearly stated
- ✅ Contact information for privacy/legal matters provided
- ✅ Copyright notice in footer
- ⚠️ Cookie consent banner (to be implemented)
- ⚠️ Data processing agreements with AI providers (verify separately)

---

## Branding Consistency

All pages now consistently reference:

- **Platform**: TranscriptAI
- **Operator**: Conn.Digital
- **Owner**: Constantin Emilian Tivlica
- **Location**: Portsmouth, UK
- **Domain**: transcriptai.conn.digital

---

*Built with ❤️ by Constantin Emilian Tivlica*
*Updated: October 22, 2025*
