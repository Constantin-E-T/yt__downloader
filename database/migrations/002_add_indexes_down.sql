-- Rollback: Remove indexes
DROP INDEX IF EXISTS idx_videos_youtube_id;
DROP INDEX IF EXISTS idx_transcripts_video_id;
DROP INDEX IF EXISTS idx_transcripts_video_language;
DROP INDEX IF EXISTS idx_videos_created_at;
DROP INDEX IF EXISTS idx_transcripts_created_at;
