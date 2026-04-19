-- Add userid column to users table
ALTER TABLE users ADD COLUMN userid VARCHAR(16);

-- Generate userid for existing users (16 lowercase alphanumeric characters)
-- Admin user gets a special userid
UPDATE users SET userid = 'admin00000000000' WHERE phone = 'admin';

-- For other existing users, generate random userids using UUID
UPDATE users SET userid = LOWER(REPLACE(SUBSTRING(UUID(), 1, 17), '-', ''))
WHERE userid IS NULL;

-- Make userid NOT NULL and UNIQUE
ALTER TABLE users MODIFY COLUMN userid VARCHAR(16) NOT NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_userid UNIQUE (userid);

-- Verify migration
SELECT 'Userid column added successfully!' AS status;
SELECT id, phone, userid, full_name FROM users;
