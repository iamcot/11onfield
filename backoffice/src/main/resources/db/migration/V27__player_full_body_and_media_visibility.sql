-- V27: full-body photo of a player, uploaded highlight videos (Bunny Stream) and hiding of highlights / achievements.
-- Numbered after V24-V26 of the admin port (PR #4); Flyway runs with out-of-order off, so merge that one first.

ALTER TABLE players
    ADD COLUMN full_body_photo VARCHAR(500) NULL COMMENT 'Full-body photo with the background removed';

ALTER TABLE player_highlights
    ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'LINK' COMMENT 'LINK = external link, VIDEO = uploaded to Bunny Stream',
    ADD COLUMN video_id VARCHAR(64) NULL COMMENT 'Bunny Stream video id of an uploaded highlight',
    ADD COLUMN poster_url VARCHAR(500) NULL,
    ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Hidden by the player: kept, never shown to others';

ALTER TABLE player_achievements
    ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Hidden by the player: kept, never shown to others';
