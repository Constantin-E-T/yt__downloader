#!/bin/bash

# AI Features Testing Script
# This script tests all three AI features locally

set -e

BASE_URL="http://localhost:8080/api/v1"
TRANSCRIPT_ID=""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  AI Features Local Testing${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Step 1: Fetch a transcript
echo -e "${YELLOW}Step 1: Fetching transcript...${NC}"
echo "Using Rick Astley - Never Gonna Give You Up (for testing)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/transcripts" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "language": "en"
  }')

echo "$RESPONSE" | jq '.'

# Extract transcript ID
TRANSCRIPT_ID=$(echo "$RESPONSE" | jq -r '.transcript.id')

if [ "$TRANSCRIPT_ID" == "null" ] || [ -z "$TRANSCRIPT_ID" ]; then
  echo -e "${RED}❌ Failed to fetch transcript${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Transcript fetched successfully!${NC}"
echo -e "Transcript ID: ${BLUE}$TRANSCRIPT_ID${NC}"
echo ""

# Wait a moment
sleep 2

# Step 2: Test Summarization
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Step 2: Testing AI Summarization${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}2a) Generating brief summary...${NC}"
curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/summarize" \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "brief"}' | jq '.'

echo -e "${GREEN}✅ Brief summary complete!${NC}"
echo ""
sleep 1

echo -e "${YELLOW}2b) Generating detailed summary...${NC}"
curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/summarize" \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "detailed"}' | jq '.'

echo -e "${GREEN}✅ Detailed summary complete!${NC}"
echo ""
sleep 1

echo -e "${YELLOW}2c) Generating key points...${NC}"
curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/summarize" \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "key_points"}' | jq '.'

echo -e "${GREEN}✅ Key points complete!${NC}"
echo ""

# Step 3: Test Extraction
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Step 3: Testing AI Extraction${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}3a) Extracting quotes...${NC}"
curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/extract" \
  -H "Content-Type: application/json" \
  -d '{"extraction_type": "quotes"}' | jq '.'

echo -e "${GREEN}✅ Quote extraction complete!${NC}"
echo ""
sleep 1

echo -e "${YELLOW}3b) Extracting action items...${NC}"
curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/extract" \
  -H "Content-Type: application/json" \
  -d '{"extraction_type": "action_items"}' | jq '.'

echo -e "${GREEN}✅ Action item extraction complete!${NC}"
echo ""

# Step 4: Test Q&A
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Step 4: Testing AI Q&A${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}4a) Asking: 'What is the main message of this song?'${NC}"
curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/qa" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main message of this song?"}' | jq '.'

echo -e "${GREEN}✅ Q&A response received!${NC}"
echo ""
sleep 1

echo -e "${YELLOW}4b) Asking: 'What does the speaker promise?'${NC}"
curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/qa" \
  -H "Content-Type: application/json" \
  -d '{"question": "What does the speaker promise?"}' | jq '.'

echo -e "${GREEN}✅ Q&A response received!${NC}"
echo ""

# Step 5: Test Caching
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Step 5: Testing Caching (Should be instant)${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}Requesting brief summary again (cached)...${NC}"
time curl -s -X POST "$BASE_URL/transcripts/$TRANSCRIPT_ID/summarize" \
  -H "Content-Type: application/json" \
  -d '{"summary_type": "brief"}' | jq '.summary_type, .created_at'

echo -e "${GREEN}✅ Caching test complete!${NC}"
echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ ALL TESTS COMPLETE!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Transcript ID used: ${BLUE}$TRANSCRIPT_ID${NC}"
echo ""
echo -e "You can test manually with:"
echo -e "  ${YELLOW}curl -X POST $BASE_URL/transcripts/$TRANSCRIPT_ID/summarize \\${NC}"
echo -e "    ${YELLOW}-H 'Content-Type: application/json' \\${NC}"
echo -e "    ${YELLOW}-d '{\"summary_type\": \"brief\"}' | jq '.'${NC}"
echo ""
