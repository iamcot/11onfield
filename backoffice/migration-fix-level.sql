-- Migration script to fix level field for enum conversion
-- Run this SQL script to clear existing level values that don't match enum constants

-- Option 1: Set all existing level values to NULL (simplest)
UPDATE players SET level = NULL WHERE level IS NOT NULL;

-- Option 2: Attempt to migrate existing values (if you have data you want to preserve)
-- Uncomment the lines below if you want to try mapping existing values:

-- UPDATE players SET level = 'CAU_THU_MOI' WHERE LOWER(level) LIKE '%mới%' OR LOWER(level) LIKE '%new%';
-- UPDATE players SET level = 'NGHIEP_DU' WHERE LOWER(level) LIKE '%nghiệp dư%' OR LOWER(level) LIKE '%amateur%';
-- UPDATE players SET level = 'TUYEN_TRE' WHERE LOWER(level) LIKE '%tuyển trẻ%' OR LOWER(level) LIKE '%youth%';
-- UPDATE players SET level = 'CHUYEN_NGHIEP' WHERE LOWER(level) LIKE '%chuyên nghiệp%' OR LOWER(level) LIKE '%professional%';
-- UPDATE players SET level = NULL WHERE level NOT IN ('CAU_THU_MOI', 'NGHIEP_DU', 'TUYEN_TRE', 'CHUYEN_NGHIEP');
