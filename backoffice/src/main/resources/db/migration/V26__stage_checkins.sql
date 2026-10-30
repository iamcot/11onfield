-- QR check-in at a stage (mostly regional auditions). A player may check in at several stages;
-- the participant row keeps the latest one, which is what the admin shows.
CREATE TABLE stage_checkins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    checked_in_at DATETIME NOT NULL,
    UNIQUE KEY uk_stage_checkins_stage_participant (stage_id, participant_id),
    CONSTRAINT fk_stage_checkins_stage FOREIGN KEY (stage_id) REFERENCES competition_stages (id) ON DELETE CASCADE,
    CONSTRAINT fk_stage_checkins_participant FOREIGN KEY (participant_id) REFERENCES competition_participants (id) ON DELETE CASCADE
);

ALTER TABLE competition_participants
    ADD COLUMN last_checkin_stage_id BIGINT NULL,
    ADD COLUMN last_checkin_at DATETIME NULL;

-- Secret behind the rotating QR code; NULL = check-in closed for the stage.
ALTER TABLE competition_stages ADD COLUMN checkin_secret VARCHAR(64) NULL;
