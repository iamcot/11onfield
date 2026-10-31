-- Scouting round 1: judge records, contestant flags, Green Cards and hand-entered scores.

ALTER TABLE users
    MODIFY COLUMN role ENUM('USER','PLAYER','COACH','SCOUTER','EDITOR','BGK','MEDICAL','COORDINATOR','ADMIN','SUPER_USER') NOT NULL;

-- A judge ticks, rates participation and leaves a note per contestant and station. Never a numeric score.
CREATE TABLE judge_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    judge_user_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    step_id BIGINT NOT NULL,
    participation VARCHAR(8) NOT NULL,           -- FULL | PARTIAL | NONE
    ticked BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_judge_notes (judge_user_id, participant_id, step_id),
    KEY idx_judge_notes_participant (participant_id),
    CONSTRAINT fk_judge_notes_judge FOREIGN KEY (judge_user_id) REFERENCES users (id),
    CONSTRAINT fk_judge_notes_participant FOREIGN KEY (participant_id) REFERENCES competition_participants (id) ON DELETE CASCADE,
    CONSTRAINT fk_judge_notes_step FOREIGN KEY (step_id) REFERENCES competition_assessment_steps (id) ON DELETE CASCADE
);

-- Flags on a contestant. Revoking keeps the row (revoked_by / revoked_at) so the history stays.
CREATE TABLE participant_flags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    stage_id BIGINT NULL,
    kind VARCHAR(20) NOT NULL,                   -- MEDICAL_OUT | DISCIPLINE | LOW_PERFORMANCE | DNS
    step_id BIGINT NULL,
    reason TEXT NULL,
    created_by BIGINT NULL,                      -- NULL = created by the system (Low Performance)
    created_at DATETIME NOT NULL,
    revoked_by BIGINT NULL,
    revoked_at DATETIME NULL,
    revoke_reason TEXT NULL,
    KEY idx_participant_flags_participant (participant_id, kind),
    CONSTRAINT fk_participant_flags_participant FOREIGN KEY (participant_id) REFERENCES competition_participants (id) ON DELETE CASCADE
);

-- Four cards per competition, each holder uses theirs once on one contestant (no taking back).
CREATE TABLE green_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    holder_user_id BIGINT NOT NULL,
    holder_title VARCHAR(100) NOT NULL,
    participant_id BIGINT NULL,
    reason TEXT NULL,
    used_at DATETIME NULL,
    UNIQUE KEY uk_green_cards_holder (competition_id, holder_user_id),
    CONSTRAINT fk_green_cards_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
    CONSTRAINT fk_green_cards_holder FOREIGN KEY (holder_user_id) REFERENCES users (id),
    CONSTRAINT fk_green_cards_participant FOREIGN KEY (participant_id) REFERENCES competition_participants (id)
);

-- Scores no device can measure (BHL 40, 7v7, thinking and media, GPS & AI). A correction is a new row pointing at the old one.
CREATE TABLE manual_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    component_key VARCHAR(20) NOT NULL,          -- BHL | TACTICAL_7V7 | MIND_MEDIA | GPS_AI
    points DECIMAL(6,2) NOT NULL,
    entered_by BIGINT NOT NULL,
    entered_at DATETIME NOT NULL,
    reason TEXT NULL,
    supersedes_id BIGINT NULL,
    KEY idx_manual_scores_lookup (stage_id, participant_id, component_key),
    CONSTRAINT fk_manual_scores_stage FOREIGN KEY (stage_id) REFERENCES competition_stages (id) ON DELETE CASCADE,
    CONSTRAINT fk_manual_scores_participant FOREIGN KEY (participant_id) REFERENCES competition_participants (id) ON DELETE CASCADE,
    CONSTRAINT fk_manual_scores_entered_by FOREIGN KEY (entered_by) REFERENCES users (id)
);
