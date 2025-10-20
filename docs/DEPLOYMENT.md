# Deployment Guide

This guide covers deploying the YouTube Transcript Downloader to production.

## Prerequisites

- Server with Ubuntu 22.04+ or similar Linux distribution
- PostgreSQL 16 (managed service recommended)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Root or sudo access to the server

## Architecture Overview

The production deployment consists of three main components:

1. **PostgreSQL Database** - Managed service (AWS RDS, DigitalOcean, etc.) or self-hosted
2. **Go Backend** - Runs as a systemd service
3. **Solid.js Frontend** - Static files served by Nginx

## Backend Deployment

### 1. Build the Backend

On your development machine:

```bash
cd backend
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/server cmd/server/main.go
```

This creates a statically-linked binary that works on any Linux system.

### 2. Server Setup

On your production server:

```bash
# Create application directory
sudo mkdir -p /opt/yt-transcripts
sudo chown www-data:www-data /opt/yt-transcripts

# Upload the binary
scp backend/bin/server user@yourserver:/opt/yt-transcripts/

# Make it executable
sudo chmod +x /opt/yt-transcripts/server
```

### 3. Environment Configuration

Create `/opt/yt-transcripts/.env.production`:

```bash
# Database (use your managed PostgreSQL credentials)
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=5432
DB_NAME=yt_transcripts_prod
DB_USER=prod_user
DB_PASSWORD=YOUR_STRONG_PASSWORD

# Backend
API_PORT=8080
API_HOST=0.0.0.0

# Environment
NODE_ENV=production
GO_ENV=production

# Logging
LOG_LEVEL=info
```

Set proper permissions:
```bash
sudo chmod 600 /opt/yt-transcripts/.env.production
sudo chown www-data:www-data /opt/yt-transcripts/.env.production
```

### 4. Systemd Service

Create `/etc/systemd/system/yt-transcripts-backend.service`:

```ini
[Unit]
Description=YouTube Transcript Downloader Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/yt-transcripts
EnvironmentFile=/opt/yt-transcripts/.env.production
ExecStart=/opt/yt-transcripts/server
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/yt-transcripts

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable yt-transcripts-backend
sudo systemctl start yt-transcripts-backend
sudo systemctl status yt-transcripts-backend
```

Check logs:
```bash
sudo journalctl -u yt-transcripts-backend -f
```

## Frontend Deployment

### 1. Build the Frontend

On your development machine:

```bash
cd frontend
pnpm install
pnpm build
```

This creates optimized static files in `frontend/dist/`.

### 2. Upload to Server

```bash
# Create web directory
sudo mkdir -p /var/www/yt-transcripts

# Upload built files
scp -r frontend/dist/* user@yourserver:/var/www/yt-transcripts/

# Set permissions
sudo chown -R www-data:www-data /var/www/yt-transcripts
sudo chmod -R 755 /var/www/yt-transcripts
```

### 3. Nginx Configuration

Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

Create `/etc/nginx/sites-available/yt-transcripts`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory for frontend
    root /var/www/yt-transcripts;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8080;
        access_log off;
    }

    # Metrics (restrict access)
    location /metrics {
        proxy_pass http://localhost:8080;
        allow 127.0.0.1;
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/yt-transcripts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Certificate (Let's Encrypt)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Obtain certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Auto-renewal is configured automatically. Test it:
```bash
sudo certbot renew --dry-run
```

## Database Setup

### Option 1: Managed PostgreSQL (Recommended)

Use a managed service like:
- AWS RDS for PostgreSQL
- DigitalOcean Managed Databases
- Google Cloud SQL
- Azure Database for PostgreSQL

Benefits:
- Automatic backups
- High availability
- Automated updates
- Monitoring included

### Option 2: Self-Hosted PostgreSQL

Install PostgreSQL 16:

```bash
sudo apt update
sudo apt install postgresql-16 postgresql-contrib
```

Configure PostgreSQL:

```bash
sudo -u postgres psql

CREATE DATABASE yt_transcripts_prod;
CREATE USER prod_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE yt_transcripts_prod TO prod_user;
\q
```

Configure remote access in `/etc/postgresql/16/main/postgresql.conf`:
```conf
listen_addresses = 'localhost'  # Or specific IP
```

Configure authentication in `/etc/postgresql/16/main/pg_hba.conf`:
```conf
host    yt_transcripts_prod    prod_user    localhost    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Database Migrations

Run migrations on your production database:

```bash
# Using psql
psql "postgres://prod_user:password@your-db-host:5432/yt_transcripts_prod" \
  -f database/migrations/001_initial_schema_up.sql

psql "postgres://prod_user:password@your-db-host:5432/yt_transcripts_prod" \
  -f database/migrations/002_add_indexes_up.sql
```

Verify migrations:
```bash
psql "postgres://prod_user:password@your-db-host:5432/yt_transcripts_prod" \
  -c "\dt"
```

## Monitoring

### Health Checks

Check application health:
```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-20T..."
}
```

### Metrics

Access metrics (from server):
```bash
curl http://localhost:8080/metrics
```

### Logs

Backend logs:
```bash
sudo journalctl -u yt-transcripts-backend -f
```

Nginx access logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

Nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

## Backup & Recovery

### Database Backups

Automated backup script (`/opt/scripts/backup-db.sh`):

```bash
#!/bin/bash
set -e

BACKUP_DIR="/opt/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="postgres://prod_user:password@your-db-host:5432/yt_transcripts_prod"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -Fc "$DB_URL" > "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.dump"
```

Make executable:
```bash
sudo chmod +x /opt/scripts/backup-db.sh
```

Add to crontab (daily at 2 AM):
```bash
sudo crontab -e
# Add:
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### Restore from Backup

```bash
pg_restore -Fc -d "$DB_URL" backup_20251020_020000.dump
```

## Updating the Application

### Backend Update

```bash
# Build new version
cd backend
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/server cmd/server/main.go

# Upload to server
scp backend/bin/server user@yourserver:/opt/yt-transcripts/server.new

# On server
sudo systemctl stop yt-transcripts-backend
sudo mv /opt/yt-transcripts/server.new /opt/yt-transcripts/server
sudo chmod +x /opt/yt-transcripts/server
sudo systemctl start yt-transcripts-backend
sudo systemctl status yt-transcripts-backend
```

### Frontend Update

```bash
# Build new version
cd frontend
pnpm build

# Upload to server
scp -r frontend/dist/* user@yourserver:/var/www/yt-transcripts/

# No restart needed - Nginx serves static files
```

### Database Migrations

Always backup before migrations:

```bash
# Backup
pg_dump -Fc "$DB_URL" > backup_before_migration.dump

# Run migration
psql "$DB_URL" -f database/migrations/00X_migration_up.sql
```

## Security Checklist

- [ ] Strong database passwords (min 16 characters)
- [ ] SSL/TLS enabled (HTTPS only)
- [ ] Firewall configured (ufw or iptables)
- [ ] Regular security updates (`sudo apt update && sudo apt upgrade`)
- [ ] Database backups automated
- [ ] Logs monitored
- [ ] Rate limiting configured (optional)
- [ ] CORS configured properly
- [ ] Secrets not in version control
- [ ] `.env` files have restricted permissions (600)

## Troubleshooting

### Backend Won't Start

Check logs:
```bash
sudo journalctl -u yt-transcripts-backend -n 50
```

Common issues:
- Database connection failed: Check `DB_HOST`, `DB_PASSWORD`
- Port already in use: Check `API_PORT`
- Permission denied: Check file ownership and permissions

### Database Connection Issues

Test connection:
```bash
psql "postgres://prod_user:password@your-db-host:5432/yt_transcripts_prod" -c "SELECT 1"
```

Check firewall:
```bash
telnet your-db-host 5432
```

### Nginx Issues

Test configuration:
```bash
sudo nginx -t
```

Check error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

## Performance Tuning

### PostgreSQL

Edit `/etc/postgresql/16/main/postgresql.conf`:

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB

# Connections
max_connections = 100

# Performance
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200
```

Restart:
```bash
sudo systemctl restart postgresql
```

### Nginx

Enable caching in `/etc/nginx/nginx.conf`:

```nginx
http {
    # Cache configuration
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

    # ... rest of config
}
```

## Additional Resources

- [PostgreSQL Production Best Practices](https://www.postgresql.org/docs/16/index.html)
- [Nginx Optimization Guide](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Systemd Service Management](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

## Support

For deployment issues:
1. Check logs first (`journalctl`, nginx logs)
2. Review this guide
3. Check GitHub issues
4. Open a new issue with logs and environment details

---

**Last Updated**: October 2025
