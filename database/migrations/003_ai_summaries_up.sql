-- Migration 003: AI Summaries and Features

DROP TABLE IF EXISTS ai_summaries;

CREATE TABLE IF NOT EXISTS ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    summary_type VARCHAR(50) NOT NULL,  -- 'brief', 'detailed', 'key_points', etc.
    content JSONB NOT NULL,              -- Structured summary data
    model VARCHAR(100) NOT NULL,         -- 'gpt-4', 'claude-3-opus', etc.
    tokens_used INTEGER,                 -- For cost tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(transcript_id, summary_type)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_ai_summaries_transcript_id ON ai_summaries(transcript_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_created_at ON ai_summaries(created_at DESC);

-- Table: ai_extractions
-- Stores extracted content from transcripts (code, quotes, action items, etc.)
CREATE TABLE IF NOT EXISTS ai_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    extraction_type VARCHAR(50) NOT NULL,  -- 'code', 'quotes', 'action_items', etc.
    content JSONB NOT NULL,                 -- Extracted items as JSON array
    model VARCHAR(100) NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(transcript_id, extraction_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_extractions_transcript_id ON ai_extractions(transcript_id);

-- Table: ai_translations
-- Stores AI-translated versions of transcripts in different languages
CREATE TABLE IF NOT EXISTS ai_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    target_language VARCHAR(10) NOT NULL,   -- 'es', 'fr', 'ja', etc.
    translated_content JSONB NOT NULL,      -- Translated segments
    model VARCHAR(100) NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(transcript_id, target_language)
);

CREATE INDEX IF NOT EXISTS idx_ai_translations_transcript_id ON ai_translations(transcript_id);
