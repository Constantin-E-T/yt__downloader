# Environment Variables for CapRover Deployment

## How to Set in CapRover

1. Go to your CapRover dashboard
2. Click on your app
3. Go to "App Configs" tab
4. Scroll down to "Environmental Variables"
5. Add each variable below one by one
6. Click "Save & Update" after adding all variables

---

## Required Variables (13 total)

### Database Configuration

```env
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_NAME=yt_transcripts
DB_USER=postgres
DB_PASSWORD=your-secure-password
```

**Notes:**
- If using CapRover's internal PostgreSQL: `DB_HOST=srv-captain--postgres`
- If using external managed DB: Use your provider's connection details
- Make sure the database is accessible from your CapRover server

---

### Backend API Configuration

```env
API_PORT=8080
```

**Notes:**
- Must be `8080` (matches the docker configuration)
- This is the internal port for the Go backend

---

### AI Configuration (Google Gemini)

```env
GOOGLE_API_KEY=your-google-api-key
AI_PROVIDER=google
AI_MODEL=gemini-2.5-flash
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
```

**Notes:**
- Get your Google API key from: https://makersuite.google.com/app/apikey
- `AI_TEMPERATURE`: 0.0 = deterministic, 1.0 = creative (0.7 is balanced)
- Alternative models: `gemini-pro`, `gemini-1.5-pro`

**Alternative: OpenAI**
```env
OPENAI_API_KEY=sk-proj-...
AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
```

**Alternative: Anthropic Claude**
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
```

---

### Frontend Configuration

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NODE_ENV=production
```

**Notes:**
- `NEXT_PUBLIC_BACKEND_URL` **MUST** be `http://localhost:8080` for single-container deployment
- If you deploy backend and frontend separately, change to your backend URL
- `NODE_ENV=production` is required for Next.js optimizations

---

## Optional Variables

### Logging

```env
LOG_LEVEL=info
```

Options: `debug`, `info`, `warn`, `error`

---

## Quick Copy-Paste Template

Copy this to a text file, replace the values, then paste into CapRover one by one:

```
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_NAME=yt_transcripts
DB_USER=postgres
DB_PASSWORD=your-secure-password

API_PORT=8080

GOOGLE_API_KEY=your-google-api-key
AI_PROVIDER=google
AI_MODEL=gemini-2.5-flash
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7

NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NODE_ENV=production
```

---

## Setting Up Your Production Values

1. **Copy** `deploy/CAPROVER_ENV_VALUES.txt.example` to `deploy/CAPROVER_ENV_VALUES.txt`
2. **Edit** the new file with your actual credentials
3. **DO NOT commit** the file with real credentials (it's in .gitignore)
4. **Copy values** from your file to CapRover dashboard

---

## Verification Checklist

After setting environment variables in CapRover:

- [ ] All 13 required variables are set
- [ ] Database credentials are correct
- [ ] `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080`
- [ ] `NODE_ENV=production`
- [ ] `API_PORT=8080`
- [ ] AI provider and API key are valid
- [ ] Click "Save & Update" in CapRover
- [ ] Redeploy the app for changes to take effect

---

## Troubleshooting

**Database connection fails:**
- Check DB_HOST is accessible from CapRover server
- Verify DB_USER and DB_PASSWORD are correct
- Ensure database exists (DB_NAME)
- Check firewall rules for external databases

**AI features not working:**
- Verify GOOGLE_API_KEY is valid
- Check API quota/billing in Google Cloud Console
- Ensure AI_PROVIDER matches your API key provider

**Frontend can't reach backend:**
- Must use `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080`
- Not `https://` (internal communication in same container)
- Not your domain name (that's external)

**Environment variables not taking effect:**
- Click "Save & Update" in CapRover
- Redeploy the app after changing variables
- Check logs: `caprover logs -a your-app-name`

---

## Security Best Practices

1. **Never commit `.env` files** with real credentials to git
2. **Use strong passwords** for database (20+ characters, random)
3. **Rotate API keys** periodically
4. **Use separate databases** for dev/staging/production
5. **Enable HTTPS** in CapRover for all apps
6. **Restrict database access** to CapRover server IP only
7. **Monitor API usage** to detect abuse

---

## Need Help?

- CapRover docs: https://caprover.com/docs
- Google AI docs: https://ai.google.dev/docs
- PostgreSQL connection strings: https://www.postgresql.org/docs/current/libpq-connect.html
