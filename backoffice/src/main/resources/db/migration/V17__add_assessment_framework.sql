-- ============================================================================
-- Migration V17: Add Flexible Assessment Framework for Competition Stages
-- ============================================================================
-- This migration adds a hierarchical assessment framework that allows admins to:
-- - Define assessment days, steps, and assessments for each competition stage
-- - Configure multiple attempts per assessment with different scoring methods
-- - Set up 5-level rating scales for assessment steps
-- - Record granular results per attempt per participant
-- - Auto-calculate step scores, ratings, and final stage scores
-- ============================================================================

-- ============================================================================
-- 1. Create competition_assessment_days table
-- ============================================================================
CREATE TABLE competition_assessment_days (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_id BIGINT NOT NULL COMMENT 'FK to competition_stages',
    day_number INT NOT NULL COMMENT 'Day sequence number (1, 2, 3...)',
    title VARCHAR(200) NOT NULL COMMENT 'Day title (e.g., "Ngày 1 - Đánh giá cơ bản")',
    description TEXT COMMENT 'Description of what will be assessed on this day',
    assessment_date DATE COMMENT 'Actual date of assessment (can differ from stage date)',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Order for UI display',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    FOREIGN KEY (stage_id) REFERENCES competition_stages(id) ON DELETE CASCADE,
    UNIQUE KEY uk_stage_day (stage_id, day_number),
    INDEX idx_stage_display_order (stage_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Assessment days within a competition stage';

-- ============================================================================
-- 2. Create competition_assessment_steps table
-- ============================================================================
CREATE TABLE competition_assessment_steps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_day_id BIGINT NOT NULL COMMENT 'FK to competition_assessment_days',
    step_number INT NOT NULL COMMENT 'Step sequence number within day',
    title VARCHAR(200) NOT NULL COMMENT 'Step title (e.g., "Registration & Warm-up")',
    description TEXT COMMENT 'Description of this assessment phase',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Order for UI display',
    has_rating_scale BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this step uses 5-level rating scale',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    FOREIGN KEY (assessment_day_id) REFERENCES competition_assessment_days(id) ON DELETE CASCADE,
    UNIQUE KEY uk_day_step (assessment_day_id, step_number),
    INDEX idx_day_display_order (assessment_day_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Assessment steps/phases within an assessment day';

-- ============================================================================
-- 3. Create competition_assessments table
-- ============================================================================
CREATE TABLE competition_assessments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_step_id BIGINT NOT NULL COMMENT 'FK to competition_assessment_steps',
    assessment_number INT NOT NULL COMMENT 'Assessment sequence number within step',
    title VARCHAR(200) NOT NULL COMMENT 'Assessment title (e.g., "20-meter shuttle run")',
    description TEXT COMMENT 'Detailed instructions for the assessment',
    unit VARCHAR(50) NOT NULL COMMENT 'Unit of measurement (seconds, meters, repetitions, points)',
    attempts_count INT NOT NULL DEFAULT 1 COMMENT 'How many times participant performs this assessment',
    scoring_method VARCHAR(20) NOT NULL COMMENT 'BEST_OF, SUM, or AVERAGE - how to aggregate attempts',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Order for UI display',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    FOREIGN KEY (assessment_step_id) REFERENCES competition_assessment_steps(id) ON DELETE CASCADE,
    UNIQUE KEY uk_step_assessment (assessment_step_id, assessment_number),
    INDEX idx_step_display_order (assessment_step_id, display_order),
    CHECK (scoring_method IN ('BEST_OF', 'SUM', 'AVERAGE')),
    CHECK (attempts_count >= 1 AND attempts_count <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Individual assessments/drills within an assessment step';

-- ============================================================================
-- 4. Create competition_assessment_step_ratings table
-- ============================================================================
CREATE TABLE competition_assessment_step_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_step_id BIGINT NOT NULL COMMENT 'FK to competition_assessment_steps',
    level INT NOT NULL COMMENT 'Rating level (1=worst, 5=best)',
    threshold_type VARCHAR(20) NOT NULL COMMENT 'EXACT or RANGE',
    threshold_value DECIMAL(10,2) COMMENT 'For EXACT: minimum score needed for this level',
    range_min DECIMAL(10,2) COMMENT 'For RANGE: minimum score (inclusive)',
    range_max DECIMAL(10,2) COMMENT 'For RANGE: maximum score (inclusive)',
    description TEXT COMMENT 'Label for this level (e.g., "Xuất sắc", "Giỏi", "Khá")',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    FOREIGN KEY (assessment_step_id) REFERENCES competition_assessment_steps(id) ON DELETE CASCADE,
    UNIQUE KEY uk_step_level (assessment_step_id, level),
    INDEX idx_step_level (assessment_step_id, level),
    CHECK (level >= 1 AND level <= 5),
    CHECK (threshold_type IN ('EXACT', 'RANGE')),
    CHECK (
        (threshold_type = 'EXACT' AND threshold_value IS NOT NULL) OR
        (threshold_type = 'RANGE' AND range_min IS NOT NULL AND range_max IS NOT NULL AND range_min <= range_max)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='5-level rating scale definition for assessment steps';

-- ============================================================================
-- 5. Create competition_assessment_results table
-- ============================================================================
CREATE TABLE competition_assessment_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_id BIGINT NOT NULL COMMENT 'FK to competition_assessments',
    participant_id BIGINT NOT NULL COMMENT 'FK to competition_participants',
    attempt_number INT NOT NULL COMMENT 'Attempt sequence (1, 2, 3... up to assessment.attempts_count)',
    result_value DECIMAL(10,2) NOT NULL COMMENT 'Raw measurement (time, distance, count, score)',
    notes TEXT COMMENT 'Optional notes for this specific attempt',
    recorded_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'When this result was entered',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    FOREIGN KEY (assessment_id) REFERENCES competition_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES competition_participants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_assessment_participant_attempt (assessment_id, participant_id, attempt_number),
    INDEX idx_assessment_participant (assessment_id, participant_id),
    INDEX idx_participant (participant_id),
    CHECK (attempt_number >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Results for individual assessment attempts';

-- ============================================================================
-- 6. Create competition_assessment_step_scores table
-- ============================================================================
CREATE TABLE competition_assessment_step_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_step_id BIGINT NOT NULL COMMENT 'FK to competition_assessment_steps',
    participant_id BIGINT NOT NULL COMMENT 'FK to competition_participants',
    total_score DECIMAL(10,2) NOT NULL COMMENT 'Aggregated score from all assessments in this step',
    rating_level INT COMMENT 'Rating level (1-5) calculated from rating scale, NULL if no scale',
    notes TEXT COMMENT 'Admin notes for this step score',
    is_calculated BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'TRUE=auto-calculated, FALSE=manual override',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    FOREIGN KEY (assessment_step_id) REFERENCES competition_assessment_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES competition_participants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_step_participant (assessment_step_id, participant_id),
    INDEX idx_step_rating (assessment_step_id, rating_level),
    INDEX idx_participant (participant_id),
    CHECK (rating_level IS NULL OR (rating_level >= 1 AND rating_level <= 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Aggregated scores and ratings for assessment steps';

-- ============================================================================
-- 7. Modify stage_results table to support calculated scores
-- ============================================================================
ALTER TABLE stage_results
ADD COLUMN is_calculated BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'TRUE=auto-calculated from assessment data, FALSE=manual entry (legacy mode)' AFTER is_public,
ADD COLUMN calculation_details JSON COMMENT 'Breakdown of score calculation: {dayScores, stepScores, assessmentScores}' AFTER is_calculated;

-- ============================================================================
-- 8. Add indexes for performance optimization
-- ============================================================================
-- Composite index for querying assessment structure hierarchy
CREATE INDEX idx_assessment_days_stage_order ON competition_assessment_days(stage_id, display_order, day_number);
CREATE INDEX idx_assessment_steps_day_order ON competition_assessment_steps(assessment_day_id, display_order, step_number);
CREATE INDEX idx_assessments_step_order ON competition_assessments(assessment_step_id, display_order, assessment_number);

-- Index for participant result queries
CREATE INDEX idx_assessment_results_participant_assessment ON competition_assessment_results(participant_id, assessment_id);
CREATE INDEX idx_step_scores_participant_step ON competition_assessment_step_scores(participant_id, assessment_step_id);

-- ============================================================================
-- Done! The flexible assessment framework is now ready.
-- Next steps:
-- 1. Create entity models in Java
-- 2. Create repositories
-- 3. Implement CompetitionAssessmentStructureService and CompetitionAssessmentResultService
-- 4. Build admin UI for structure management and result entry
-- ============================================================================
