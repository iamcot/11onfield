-- V10: Add approval status to achievements and highlights, add verification to players

-- Add approval status to player_achievements
ALTER TABLE player_achievements
ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
COMMENT 'Approval status: PENDING, APPROVED, REJECTED';

-- Add index for efficient filtering
CREATE INDEX idx_achievement_approval_status ON player_achievements(approval_status);

-- Add approval status to player_highlights
ALTER TABLE player_highlights
ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
COMMENT 'Approval status: PENDING, APPROVED, REJECTED';

-- Add index for efficient filtering
CREATE INDEX idx_highlight_approval_status ON player_highlights(approval_status);

-- Add verification status to players
ALTER TABLE players
ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE
COMMENT 'Whether player profile is verified by admin';

-- Add index for verified players
CREATE INDEX idx_player_verified ON players(verified);
