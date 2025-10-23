#!/bin/bash
set -e

echo "🚀 Deploying Frontend to CapRover..."
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)

echo "📦 Copying frontend files to temporary directory..."
rsync -a \
    --exclude='deploy.tar.gz' \
    --exclude='deploy-frontend.sh' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.turbo' \
    --exclude='coverage' \
    --exclude='.env' \
    --exclude='.env.local' \
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

CAPROVER_MACHINE="${CAPROVER_MACHINE:-woooba-captain}"
CAPROVER_APP="${CAPROVER_APP:-transcriptai}"

echo "📤 Deploying to CapRover..."
echo "   ➜ Machine: ${CAPROVER_MACHINE}"
echo "   ➜ App:      ${CAPROVER_APP}"
echo ""

caprover deploy \
  --caproverName "${CAPROVER_MACHINE}" \
  --caproverApp "${CAPROVER_APP}" \
  -t deploy.tar.gz

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Don't forget to:"
echo "  1. Set NEXT_PUBLIC_BACKEND_URL in CapRover app config (Build Args):"
echo "     NEXT_PUBLIC_BACKEND_URL=https://transcriptai-backend.serverplus.org"
echo "  2. Enable HTTPS in CapRover"
echo "  3. Test: https://your-frontend-app.yourserver.com"
