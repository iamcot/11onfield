-- Add date column to player_achievements
ALTER TABLE player_achievements
ADD COLUMN achievement_date DATE COMMENT 'Date of achievement';

-- Add date column to player_highlights
ALTER TABLE player_highlights
ADD COLUMN highlight_date DATE COMMENT 'Date of highlight video';
