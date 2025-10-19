-- Migration: 001_initial_schema (DOWN)
-- Description: Drop core tables for videos, transcripts, and AI summaries
-- Author: Database Agent
-- Date: 2024-10-18

BEGIN;

DROP INDEX IF EXISTS idx_ai_summaries_transcript_id;
DROP TABLE IF EXISTS ai_summaries;

DROP INDEX IF EXISTS idx_transcripts_video_id;
DROP TABLE IF EXISTS transcripts;

DROP INDEX IF EXISTS idx_videos_youtube_id;
DROP TABLE IF EXISTS videos;

COMMIT;
