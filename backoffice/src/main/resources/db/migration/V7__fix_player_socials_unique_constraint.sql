-- Remove global UNIQUE constraint on url
ALTER TABLE player_socials DROP INDEX url;

-- Add composite UNIQUE constraint on (player_id, url) instead
-- This allows same URL for different players but not duplicates for same player
ALTER TABLE player_socials ADD CONSTRAINT unique_player_url UNIQUE (player_id, url);
