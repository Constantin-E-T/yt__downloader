#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}YouTube Transcript Downloader CapRover Deployment Script${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"

# Check if caprover CLI is installed
if ! command -v caprover &> /dev/null; then
    echo -e "${RED}CapRover CLI not found. Install with: npm install -g caprover${NC}"
    exit 1
fi

echo -e "${GREEN}Preparing deployment package...${NC}"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="${PROJECT_ROOT}/deploy/caprover"

# Copy backend files
echo "Copying backend files..."
rsync -a \
    --exclude='data' \
    --exclude='.env' \
    --exclude='.env.production' \
    --exclude='test_*.go' \
    --exclude='main' \
    --exclude='*.test' \
    "${PROJECT_ROOT}/backend/" "$TEMP_DIR/backend/"

# Copy frontend files
echo "Copying frontend files..."
rsync -a \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.turbo' \
    --exclude='coverage' \
    --exclude='.env' \
    --exclude='.env.local' \
    "${PROJECT_ROOT}/frontend/" "$TEMP_DIR/frontend/"

# Copy captain-definition and nginx config
mkdir -p "$TEMP_DIR/deploy/caprover"
cp "${DEPLOY_DIR}/captain-definition" "$TEMP_DIR/"
cp "${DEPLOY_DIR}/nginx.conf" "$TEMP_DIR/deploy/caprover/"

# Create tarball from temp directory
echo "Creating deployment tarball..."
tar -czf "${DEPLOY_DIR}/deploy.tar.gz" -C "$TEMP_DIR" .

# Deploy
echo -e "${GREEN}Deploying to CapRover...${NC}"
(
    cd "${DEPLOY_DIR}"
    caprover deploy -t ./deploy.tar.gz
)

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Post-deployment checklist:${NC}"
echo "  1. Set environment variables in CapRover dashboard:"
echo "     - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
echo "     - GOOGLE_API_KEY, AI_PROVIDER, AI_MODEL, AI_MAX_TOKENS, AI_TEMPERATURE"
echo "     - NEXT_PUBLIC_BACKEND_URL (use http://localhost:8080 for internal)"
echo "  2. Enable HTTPS in CapRover"
echo "  3. Run database migrations: go run cmd/migrate/main.go up"
echo "  4. Configure custom domain (optional)"
echo "  5. Test endpoints:"
echo "     - Frontend: https://your-app.yourserver.com"
echo "     - Backend health: https://your-app.yourserver.com:8080/health"
