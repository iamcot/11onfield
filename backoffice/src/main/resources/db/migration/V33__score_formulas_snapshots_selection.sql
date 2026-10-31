-- V33: round formula, score snapshots and the manual Top 30 selection.
-- (V31 is skipped on purpose: V32 shipped first and Flyway runs with out-of-order off.)

-- Versioned round formula; the newest row of a stage is the one in force, locked_at freezes it.
CREATE TABLE score_formulas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_id BIGINT NOT NULL,
    version INT NOT NULL,
    definition JSON NOT NULL COMMENT 'components, topicManual, classes, tieBreak',
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL,
    locked_at DATETIME NULL,
    UNIQUE KEY uk_formula_version (stage_id, version),
    CONSTRAINT fk_formula_stage FOREIGN KEY (stage_id) REFERENCES competition_stages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Latest computed round score of each participant, with the whole breakdown so the admin can explain it.
CREATE TABLE score_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    formula_version INT NOT NULL,
    total DECIMAL(6,2) NULL,
    complete BOOLEAN NOT NULL,
    classification VARCHAR(40) NULL,
    breakdown JSON NOT NULL,
    computed_at DATETIME NOT NULL,
    UNIQUE KEY uk_snapshot (stage_id, participant_id),
    CONSTRAINT fk_snapshot_stage FOREIGN KEY (stage_id) REFERENCES competition_stages (id) ON DELETE CASCADE,
    CONSTRAINT fk_snapshot_participant FOREIGN KEY (participant_id) REFERENCES competition_participants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One judge's personal pick of a participant for a selection round (TOP30, TOP11 ...).
CREATE TABLE selection_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    round_key VARCHAR(20) NOT NULL,
    judge_user_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    UNIQUE KEY uk_vote (competition_id, round_key, judge_user_id, participant_id),
    CONSTRAINT fk_vote_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
    CONSTRAINT fk_vote_participant FOREIGN KEY (participant_id) REFERENCES competition_participants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The head of the panel's decision; the newest row of a round is the one in force.
CREATE TABLE selection_decisions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    round_key VARCHAR(20) NOT NULL,
    participant_ids JSON NOT NULL,
    notes JSON NULL COMMENT 'participantId -> why picked out of score order',
    decided_by BIGINT NULL,
    decided_at DATETIME NOT NULL,
    CONSTRAINT fk_decision_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
    INDEX idx_decision_round (competition_id, round_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
