-- Migration: Add performance indexes

-- Index on videos.youtube_id (most common lookup)
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);

-- Index on transcripts.video_id (foreign key lookups)
CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON transcripts(video_id);

-- Composite index for language-based queries
CREATE INDEX IF NOT EXISTS idx_transcripts_video_language ON transcripts(video_id, language);

-- Index on created_at for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);
