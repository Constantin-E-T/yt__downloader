#!/bin/bash
set -e

echo "🚀 Deploying Backend to CapRover..."
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)

echo "📦 Copying backend files to temporary directory..."
rsync -a \
    --exclude='deploy.tar.gz' \
    --exclude='deploy-backend.sh' \
    --exclude='data' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='test_*.go' \
    --exclude='main' \
    --exclude='*.test' \
    --exclude='.git' \
    ./ "$TEMP_DIR/"

# Create tarball from temp directory
echo "📦 Creating deployment tarball..."
ORIGINAL_DIR=$(pwd)
cd "$TEMP_DIR"
tar -czf "$ORIGINAL_DIR/deploy.tar.gz" .
cd "$ORIGINAL_DIR"

# Cleanup temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Tarball created: deploy.tar.gz"
echo ""
echo "📤 Deploying to CapRover..."
caprover deploy -t deploy.tar.gz

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Don't forget to:"
echo "  1. Set environment variables in CapRover dashboard"
echo "  2. Enable HTTPS in CapRover"
echo "  3. Test: https://your-backend-app.yourserver.com/health"
