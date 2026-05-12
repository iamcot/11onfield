-- Add new fields to players table
ALTER TABLE players
ADD COLUMN personal_id VARCHAR(20) COMMENT 'CCCD/Identity card number',
ADD COLUMN address VARCHAR(500) COMMENT 'Full residential address',
ADD COLUMN school VARCHAR(200) COMMENT 'Current school',
ADD COLUMN academy VARCHAR(200) COMMENT 'Football academy',
ADD COLUMN club VARCHAR(200) COMMENT 'Current football club';

-- Create player_achievements table
CREATE TABLE IF NOT EXISTS player_achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id BIGINT NOT NULL,
    type ENUM('INDIVIDUAL', 'TEAM') NOT NULL COMMENT 'Achievement type',
    title VARCHAR(300) NOT NULL COMMENT 'Achievement title',
    description TEXT COMMENT 'Achievement description',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_player_type (player_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Player achievements (individual and team)';

-- Create player_highlights table
CREATE TABLE IF NOT EXISTS player_highlights (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL COMMENT 'Video URL',
    platform VARCHAR(50) COMMENT 'Platform (youtube, facebook, vimeo, etc.)',
    title VARCHAR(200) COMMENT 'Video title',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_player_id (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Player highlight videos';

-- Create player_socials table
CREATE TABLE IF NOT EXISTS player_socials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL UNIQUE COMMENT 'Social media profile URL',
    platform VARCHAR(50) COMMENT 'Platform (facebook, instagram, tiktok, etc.)',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_player_id (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Player social media profiles';
