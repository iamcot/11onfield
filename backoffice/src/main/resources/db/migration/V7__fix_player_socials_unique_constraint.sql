-- Drop the global UNIQUE constraint on url
ALTER TABLE player_socials DROP INDEX UK_chsn19vou9t76me8a07o702rb;

-- Add composite UNIQUE constraint on player_id + url
-- This allows same URL for different players, but prevents duplicate URLs per player
ALTER TABLE player_socials ADD UNIQUE KEY unique_player_url (player_id, url);
