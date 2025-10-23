#!/bin/bash
set -e

echo "🐳 Testing Frontend with Docker..."
echo ""

# Build the frontend image
echo "📦 Building frontend Docker image..."
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 \
  -t yt-frontend-test .

echo ""
echo "✅ Build successful!"
echo ""

# Run the container
echo "🚀 Starting frontend container..."
echo "Frontend will be available at: http://localhost:3000"
echo ""
docker run --rm \
  --name yt-frontend-test \
  -p 3000:80 \
  yt-frontend-test

# To run in background: docker run -d --name yt-frontend-test -p 3000:80 yt-frontend-test
# To stop: docker stop yt-frontend-test
# To view logs: docker logs -f yt-frontend-test
