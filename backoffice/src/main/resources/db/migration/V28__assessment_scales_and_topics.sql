-- V28: scouting combine scoring config.
-- A step is a test (bài thi), an assessment is one measured item of it (nội dung thi).
-- A step's 5-level scale now sets a condition per assessment; the participant gets the highest level whose every
-- condition holds. Steps are grouped into score topics (nhóm điểm) worth a share of the day's 100 points.

ALTER TABLE competition_assessments
    ADD COLUMN direction VARCHAR(10) NOT NULL DEFAULT 'HIGHER' COMMENT 'HIGHER or LOWER is better (sprint, 2.000 m)',
    ADD COLUMN plausible_min DECIMAL(10,3) NULL COMMENT 'Values outside [plausible_min, plausible_max] go to review',
    ADD COLUMN plausible_max DECIMAL(10,3) NULL,
    ADD COLUMN tolerance DECIMAL(10,3) NULL COMMENT 'Allowed gap between two sources of the same attempt',
    ADD COLUMN value_type VARCHAR(12) NOT NULL DEFAULT 'NUMBER' COMMENT 'NUMBER, DURATION (seconds) or COUNT';

CREATE TABLE competition_score_topics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_day_id BIGINT NOT NULL,
    topic_key VARCHAR(30) NOT NULL COMMENT 'BODY, FITNESS, TECHNIQUE, DUEL, MIND, IMAGE ...',
    name VARCHAR(100) NOT NULL,
    max_points DECIMAL(6,2) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    tie_break_order INT NULL COMMENT 'Lower breaks ties first; NULL = not used',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (assessment_day_id) REFERENCES competition_assessment_days(id) ON DELETE CASCADE,
    UNIQUE KEY uk_day_topic (assessment_day_id, topic_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE competition_assessment_steps
    ADD COLUMN is_scored BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'FALSE for warm-up, recovery',
    ADD COLUMN audience VARCHAR(12) NOT NULL DEFAULT 'ALL' COMMENT 'ALL, OUTFIELD or GOALKEEPER',
    ADD COLUMN topic_id BIGINT NULL,
    ADD CONSTRAINT fk_step_topic FOREIGN KEY (topic_id) REFERENCES competition_score_topics(id) ON DELETE SET NULL;

-- Old single-threshold columns stay for existing stages; a level that has conditions ignores them.
ALTER TABLE competition_assessment_step_ratings
    ADD COLUMN color VARCHAR(10) NULL COMMENT 'GREY, RED, ORANGE, YELLOW, GREEN',
    ADD COLUMN action VARCHAR(12) NOT NULL DEFAULT 'NONE' COMMENT 'NONE, FLAG (Low Performance) or ELIMINATE',
    MODIFY COLUMN threshold_type VARCHAR(20) NULL COMMENT 'NULL when the level is set by conditions';


CREATE TABLE competition_rating_conditions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rating_id BIGINT NOT NULL,
    assessment_id BIGINT NOT NULL,
    range_min DECIMAL(10,3) NULL COMMENT 'Inclusive; NULL = no lower bound',
    range_max DECIMAL(10,3) NULL COMMENT 'Inclusive; NULL = no upper bound',
    FOREIGN KEY (rating_id) REFERENCES competition_assessment_step_ratings(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES competition_assessments(id) ON DELETE CASCADE,
    UNIQUE KEY uk_rating_assessment (rating_id, assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
