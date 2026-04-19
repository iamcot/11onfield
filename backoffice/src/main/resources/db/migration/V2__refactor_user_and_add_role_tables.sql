-- Database Migration Script
-- Refactors User table and creates role-specific tables
-- Execute this script manually before starting the application

-- Step 1: Create new role-specific tables
CREATE TABLE IF NOT EXISTS players (
    id BIGINT PRIMARY KEY,
    positions VARCHAR(500),
    height INT,
    weight INT,
    preferred_foot VARCHAR(10),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coaches (
    id BIGINT PRIMARY KEY,
    specialization VARCHAR(100),
    years_of_experience INT,
    certifications VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scouters (
    id BIGINT PRIMARY KEY,
    territory VARCHAR(200),
    specialization VARCHAR(200),
    years_of_experience INT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 2: Add temporary phone column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Step 3: Copy username data to phone column
UPDATE users SET phone = username;

-- Step 4: Make phone NOT NULL and UNIQUE
ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NOT NULL UNIQUE;

-- Step 5: Migrate existing player data to players table
-- Only migrate if is_player = true AND positions is not null
INSERT INTO players (id, positions, height, weight, preferred_foot, created_at, updated_at)
SELECT id, positions, height, weight, preferred_foot, NOW(), NOW()
FROM users
WHERE is_player = 1 AND positions IS NOT NULL;

-- Step 6: Update role enum to support new roles
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL;

-- Step 7: Update user role for migrated players
UPDATE users SET role = 'PLAYER' WHERE is_player = 1;

-- Step 8: Drop old username column
ALTER TABLE users DROP COLUMN username;

-- Step 9: Drop player-specific columns from users table
ALTER TABLE users DROP COLUMN is_player;
ALTER TABLE users DROP COLUMN positions;
ALTER TABLE users DROP COLUMN height;
ALTER TABLE users DROP COLUMN weight;
ALTER TABLE users DROP COLUMN preferred_foot;

-- Verify migration
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS players_count FROM players;
SELECT COUNT(*) AS coaches_count FROM coaches;
SELECT COUNT(*) AS scouters_count FROM scouters;
