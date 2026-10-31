-- V29: every number is an append-only raw record; reconciliation picks the official value of each attempt.
-- competition_assessment_results stays as a mirror of the official values so existing screens keep working.

CREATE TABLE measurement_raw (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_uuid VARCHAR(36) NULL COMMENT 'Set by the sender; a repeat is ignored',
    assessment_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    attempt_number INT NOT NULL,
    value DECIMAL(10,3) NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'OK' COMMENT 'OK, FAULT (failed attempt) or DNS (did not start)',
    fault_note VARCHAR(200) NULL,
    source VARCHAR(10) NOT NULL COMMENT 'MANUAL, DEVICE, FILE or VIDEO',
    device_id BIGINT NULL,
    recorded_by BIGINT NULL COMMENT 'User who typed it in',
    measured_at DATETIME(3) NOT NULL,
    received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    evidence_url VARCHAR(500) NULL,
    supersedes_id BIGINT NULL COMMENT 'A correction points at the record it replaces',
    reason VARCHAR(300) NULL,
    FOREIGN KEY (assessment_id) REFERENCES competition_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES competition_participants(id) ON DELETE CASCADE,
    FOREIGN KEY (supersedes_id) REFERENCES measurement_raw(id),
    UNIQUE KEY uk_client_uuid (client_uuid),
    INDEX idx_attempt (assessment_id, participant_id, attempt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE measurement_official (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    attempt_number INT NOT NULL,
    raw_id BIGINT NULL,
    state VARCHAR(12) NOT NULL COMMENT 'AUTO, REVIEW, RESOLVED or LOCKED',
    review_reason VARCHAR(30) NULL COMMENT 'SOURCE_MISMATCH, IMPLAUSIBLE, AFTER_LOCK, AFTER_RESOLVE; NEAR_BOUNDARY is a note on AUTO',
    resolved_by BIGINT NULL,
    resolved_at DATETIME NULL,
    note VARCHAR(300) NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (assessment_id) REFERENCES competition_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES competition_participants(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_id) REFERENCES measurement_raw(id),
    UNIQUE KEY uk_official_attempt (assessment_id, participant_id, attempt_number),
    INDEX idx_official_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessment_locks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    step_id BIGINT NOT NULL,
    locked_by BIGINT NULL,
    locked_at DATETIME NOT NULL,
    unlocked_by BIGINT NULL,
    unlocked_at DATETIME NULL,
    reason VARCHAR(300) NULL COMMENT 'Required to unlock',
    FOREIGN KEY (step_id) REFERENCES competition_assessment_steps(id) ON DELETE CASCADE,
    INDEX idx_lock_step (step_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO measurement_raw (assessment_id, participant_id, attempt_number, value, status, source, measured_at, received_at, reason)
SELECT assessment_id, participant_id, attempt_number, result_value, 'OK', 'MANUAL', recorded_at, created_at, 'Chuyển từ kết quả cũ'
FROM competition_assessment_results;

INSERT INTO measurement_official (assessment_id, participant_id, attempt_number, raw_id, state)
SELECT assessment_id, participant_id, attempt_number, id, 'AUTO' FROM measurement_raw;
