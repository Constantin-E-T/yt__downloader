-- Migration: 001_initial_schema
-- Description: Create core tables for videos, transcripts, and AI summaries
-- Author: Database Agent
-- Date: 2024-10-18

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_id VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    channel TEXT,
    duration INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos (youtube_id);

CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL,
    language VARCHAR(10) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT transcripts_video_id_fkey
        FOREIGN KEY (video_id) REFERENCES videos (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON transcripts (video_id);

CREATE TABLE IF NOT EXISTS ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ai_summaries_transcript_id_fkey
        FOREIGN KEY (transcript_id) REFERENCES transcripts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_transcript_id ON ai_summaries (transcript_id);

COMMIT;
