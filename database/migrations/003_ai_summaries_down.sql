-- Migration 003 Rollback: Drop AI tables

DROP TABLE IF EXISTS ai_translations;
DROP TABLE IF EXISTS ai_extractions;
DROP TABLE IF EXISTS ai_summaries;
