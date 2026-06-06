-- Drop existing competition tables (if they exist)
-- Run this manually in MySQL before starting the application
-- This ensures Flyway V16 migration can create tables with correct VARCHAR columns

USE elevenof_db;

-- Drop in reverse order of dependencies
DROP TABLE IF EXISTS stage_results;
DROP TABLE IF EXISTS competition_news;
DROP TABLE IF EXISTS competition_sponsors;
DROP TABLE IF EXISTS competition_participants;
DROP TABLE IF EXISTS competition_stages;
DROP TABLE IF EXISTS competitions;

-- Verify tables are dropped
SHOW TABLES LIKE 'competition%';
