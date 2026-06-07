-- Convert data to uppercase first
UPDATE competition_assessment_step_ratings SET threshold_type = 'EXACT' WHERE threshold_type = 'exact';
UPDATE competition_assessment_step_ratings SET threshold_type = 'RANGE' WHERE threshold_type = 'range';
-- Change column type to uppercase enum values
ALTER TABLE competition_assessment_step_ratings MODIFY COLUMN threshold_type ENUM('EXACT','RANGE') NOT NULL;
