-- Migration V13: Add Synthetic Attribute Support
-- Add flags to distinguish synthetic (auto-generated) from real (manually entered) attributes

-- Add is_synthetic flag to player_attributes
ALTER TABLE player_attributes
ADD COLUMN is_synthetic BOOLEAN NOT NULL DEFAULT FALSE
COMMENT 'Whether this attribute is auto-generated or manually entered';

-- Add generation timestamp to track when synthetic attribute was last generated
ALTER TABLE player_attributes
ADD COLUMN generation_timestamp DATETIME(6) NULL
COMMENT 'When synthetic attribute was last generated';

-- Add index for efficient filtering by player and synthetic status
CREATE INDEX idx_attribute_is_synthetic ON player_attributes(player_id, is_synthetic);

-- Insert 6 standard synthetic attribute types (if they don't exist)
-- Using 3-letter English codes as keys, Vietnamese names for display
-- Note: is_hexagon = false to avoid conflict with existing 6 hexagon attributes limit
-- Synthetic attributes are queried separately by their specific attribute keys
INSERT INTO player_attribute_types (attribute_key, attribute_name, is_hexagon, is_goal_keeper, attribute_group, created_at, updated_at, created_by)
SELECT * FROM (
    SELECT 'FIT' as attribute_key, 'Thể chất' as attribute_name, false as is_hexagon, false as is_goal_keeper, 'synthetic_physical' as attribute_group, NOW() as created_at, NOW() as updated_at, 'SYSTEM' as created_by UNION ALL
    SELECT 'EXP', 'Kinh nghiệm', false, false, 'synthetic_experience', NOW(), NOW(), 'SYSTEM' UNION ALL
    SELECT 'SKL', 'Kỹ năng', false, false, 'synthetic_skills', NOW(), NOW(), 'SYSTEM' UNION ALL
    SELECT 'PRF', 'Hoàn thiện profile', false, false, 'synthetic_profile', NOW(), NOW(), 'SYSTEM' UNION ALL
    SELECT 'ACH', 'Thành tích', false, false, 'synthetic_achievement', NOW(), NOW(), 'SYSTEM' UNION ALL
    SELECT 'HLT', 'Highlights', false, false, 'synthetic_highlight', NOW(), NOW(), 'SYSTEM'
) AS new_types
WHERE NOT EXISTS (
    SELECT 1 FROM player_attribute_types WHERE attribute_key = new_types.attribute_key
);
