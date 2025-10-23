# CapRover Deployment Guide

This guide will help you deploy the YouTube Transcript Downloader as a **single unified app** to CapRover.

## Architecture

The deployment creates **one CapRover app** that runs:
- **Nginx** on port 80 (public-facing)
- **Backend (Go)** on port 8080 (internal)
- **Frontend (Next.js)** on port 3000 (internal)

```
                      Port 80 (HTTPS)
                           │
                           ▼
┌──────────────────────────────────────────────┐
│         CapRover App Container               │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │              Nginx                     │ │
│  │         (Reverse Proxy)                │ │
│  │           Port: 80                     │ │
│  └────┬──────────────────────────┬────────┘ │
│       │                          │          │
│       │ /api/*      /*           │          │
│       ▼                          ▼          │
│  ┌─────────────┐         ┌──────────────┐  │
│  │  Backend    │         │  Frontend    │  │
│  │  (Go API)   │         │  (Next.js)   │  │
│  │  Port: 8080 │         │  Port: 3000  │  │
│  └─────────────┘         └──────────────┘  │
└──────────────────────────────────────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │   PostgreSQL     │
         │   (External)     │
         └──────────────────┘
```

**Routing:**
- `https://transcriptai.serverplus.org/` → Frontend (port 3000)
- `https://transcriptai.serverplus.org/api/*` → Backend (port 8080)
- `https://transcriptai.serverplus.org/health` → Backend (port 8080)

## Prerequisites

1. **CapRover Server**: A running CapRover instance
2. **CapRover CLI**: Install globally with `npm install -g caprover`
3. **PostgreSQL Database**: External database (managed service recommended)

## Step 1: Initial Setup

### Install CapRover CLI

```bash
npm install -g caprover
```

### Login to CapRover

```bash
caprover login
```

Follow the prompts to connect to your CapRover server.

## Step 2: Create the App

1. Go to your CapRover dashboard
2. Click "Apps" → "One-Click Apps/Databases"
3. Or manually create a new app:
   - App Name: `yt-transcript` (or your preferred name)
   - Check "Has Persistent Data" if needed

## Step 3: Configure Environment Variables

Set these environment variables in the CapRover dashboard for your app:

### Required Variables

```env
# Database Configuration
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_NAME=ytdownloader
DB_USER=ytdownloader_app
DB_PASSWORD=your-secure-password

# API Configuration
API_PORT=8080

# AI Configuration (Google Gemini)
GOOGLE_API_KEY=your-google-api-key
AI_PROVIDER=google
AI_MODEL=gemini-2.5-flash
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Important Notes:

- `NEXT_PUBLIC_BACKEND_URL` should be `http://localhost:8080` since frontend and backend run in the same container
- For external access, you'll expose port 3000 (frontend)
- Backend communicates internally on port 8080

## Step 4: Deploy

From the project root, run:

```bash
./deploy.sh
```

This will:
1. Package both frontend and backend
2. Create a tarball
3. Deploy to CapRover
4. Build the Docker container
5. Start both services

### First-Time Deployment

If this is your first deployment, CapRover CLI will ask for the app name:

```bash
caprover deploy -t ./deploy/caprover/deploy.tar.gz -a yt-transcript
```

## Step 5: Post-Deployment Configuration

### 1. Enable HTTPS

In the CapRover dashboard:
- Go to your app
- Enable "HTTPS"
- Enable "Force HTTPS"
- CapRover will provision Let's Encrypt SSL automatically

### 2. Configure Port Mapping

CapRover automatically exposes port 80. Nginx inside the container routes:
- `/` → Frontend (Next.js on port 3000)
- `/api/*` → Backend (Go on port 8080)
- `/health` → Backend health check

### 3. Run Database Migrations

You need to run migrations to set up your database schema. Two options:

**Option A: From your local machine**

```bash
cd backend

# Set your production database credentials
export DB_HOST=your-postgres-host.com
export DB_PORT=5432
export DB_NAME=ytdownloader
export DB_USER=ytdownloader_app
export DB_PASSWORD=your-secure-password

# Run migrations
go run cmd/migrate/main.go up
```

**Option B: SSH into the container**

```bash
# In CapRover dashboard, use the web terminal or:
docker exec -it $(docker ps | grep yt-transcript | awk '{print $1}') sh

# Then run:
cd /app/backend
./server migrate up
```

### 4. Set Up Custom Domain (Optional)

In the CapRover dashboard:
1. Go to your app
2. Add custom domain (e.g., `transcript.yourdomain.com`)
3. Update your DNS:
   - Add A record pointing to your CapRover server IP
   - Or CNAME to your CapRover server domain
4. Wait for DNS propagation
5. Enable HTTPS for the custom domain

## Step 6: Verify Deployment

### Check Health Endpoints

```bash
# Frontend (should show the app)
curl https://transcriptai.serverplus.org

# Backend health check (routed through Nginx)
curl https://transcriptai.serverplus.org/health

# API endpoint test
curl https://transcriptai.serverplus.org/api/health
```

### Check Logs

```bash
caprover logs -a yt-transcript --tail 100
```

You should see both frontend and backend logs.

## Database Setup

### Option A: CapRover PostgreSQL (Development)

1. In CapRover dashboard → "One-Click Apps/Databases"
2. Deploy PostgreSQL
3. Use internal connection details:
   ```
   DB_HOST=srv-captain--postgres
   DB_PORT=5432
   DB_NAME=ytdownloader
   DB_USER=postgres
   DB_PASSWORD=<from CapRover>
   ```

### Option B: External Managed Database (Production Recommended)

Use a managed PostgreSQL service:
- AWS RDS
- Digital Ocean Managed Database
- Supabase
- Neon
- Railway

Benefits:
- Automatic backups
- Better performance
- Easier scaling
- Point-in-time recovery

## Updating After Code Changes

Simply run the deployment script again:

```bash
./deploy.sh
```

CapRover will:
1. Build a new Docker image
2. Replace the running container
3. Keep environment variables intact
4. Minimal downtime

## Troubleshooting

### Check Logs

```bash
caprover logs -a yt-transcript --tail 100 -f
```

### Common Issues

**Frontend can't connect to backend:**
- Ensure `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080`
- Both services run in the same container

**Database connection failed:**
- Verify all DB environment variables are correct
- Check database is accessible from CapRover server
- Ensure migrations have been run
- Check firewall rules for external databases

**Build failures:**
- Check the build logs in CapRover dashboard
- Ensure `frontend/next.config.ts` has `output: "standalone"`
- Verify all dependencies in `go.mod` and `package.json`

**Port conflicts:**
- Ensure no other services are using ports 3000 or 8080 in the container
- Check CapRover app configuration

### Debugging Inside Container

```bash
# Get container ID
docker ps | grep yt-transcript

# SSH into container
docker exec -it <container-id> sh

# Check if backend is running
ps aux | grep server

# Check if frontend is running
ps aux | grep node

# Test backend locally
wget -O- http://localhost:8080/health

# Test frontend locally
wget -O- http://localhost:3000
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `postgres.example.com` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ytdownloader` |
| `DB_USER` | Database user | `ytdownloader_app` |
| `DB_PASSWORD` | Database password | `secure_password_123` |
| `API_PORT` | Backend API port | `8080` |
| `GOOGLE_API_KEY` | Google Gemini API key | `AIza...` |
| `AI_PROVIDER` | AI provider | `google` |
| `AI_MODEL` | AI model name | `gemini-2.5-flash` |
| `AI_MAX_TOKENS` | Max tokens per request | `4000` |
| `AI_TEMPERATURE` | AI creativity (0-1) | `0.7` |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL for frontend | `http://localhost:8080` |

## Security Checklist

- [ ] HTTPS enabled and forced
- [ ] Strong database password set
- [ ] API keys stored in environment variables (not in code)
- [ ] Database not publicly accessible (or IP whitelisted)
- [ ] Custom domain with SSL configured
- [ ] Regular database backups enabled
- [ ] CapRover firewall configured properly

## Performance Tips

1. **Enable HTTP/2** in CapRover for better performance
2. **Use CDN** for static assets if needed (Cloudflare, etc.)
3. **Database connection pooling** is enabled by default in the app
4. **Monitor logs** for slow queries or errors
5. **Set up monitoring** (optional): Sentry, Prometheus, etc.

## Cost Optimization

- Start with a small CapRover server (2GB RAM)
- Use external managed database for production
- Scale vertically as needed
- Consider database read replicas for high traffic
- Use caching for frequently accessed data

## Rollback

If deployment fails or issues occur:

```bash
# In CapRover dashboard:
# Apps → Your App → Deployment → Previous Versions
# Click "Deploy" on a previous working version
```

## Support

For issues specific to:
- **CapRover**: https://caprover.com/docs
- **This app**: Check project README or GitHub issues
