-- Plan 06 part 3: how many go on to the next day, and who is on a day's list.
-- advance_count sits on the day the ranking comes from (day 1: 110). day_participants lists the people of the next day:
-- TOP from that ranking, EXCEPTION added by a coach or admin with a reason. A day without rows is open to everyone.
ALTER TABLE competition_assessment_days ADD COLUMN advance_count INT NULL;

CREATE TABLE day_participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    day_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    reason VARCHAR(10) NOT NULL COMMENT 'TOP or EXCEPTION',
    note VARCHAR(300) NULL,
    added_by BIGINT NULL,
    added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (day_id) REFERENCES competition_assessment_days(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES competition_participants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_day_participant (day_id, participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
