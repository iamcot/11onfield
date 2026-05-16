-- Add PARTICIPANT to achievement type enum
ALTER TABLE player_achievements
MODIFY COLUMN type ENUM('INDIVIDUAL', 'TEAM', 'PARTICIPANT') NOT NULL COMMENT 'Achievement type';

