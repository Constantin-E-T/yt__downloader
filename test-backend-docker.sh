#!/bin/bash
set -e

echo "🐳 Testing Backend with Docker..."
echo ""

# Build the backend image
echo "📦 Building backend Docker image..."
cd backend
docker build -t yt-backend-test .

echo ""
echo "✅ Build successful!"
echo ""

# Run the container with environment variables
echo "🚀 Starting backend container..."
docker run --rm \
  --name yt-backend-test \
  -p 8080:8080 \
  --env-file .env.docker \
  yt-backend-test

# To run in background: docker run -d --name yt-backend-test -p 8080:8080 --env-file .env.docker yt-backend-test
# To stop: docker stop yt-backend-test
# To view logs: docker logs -f yt-backend-test
