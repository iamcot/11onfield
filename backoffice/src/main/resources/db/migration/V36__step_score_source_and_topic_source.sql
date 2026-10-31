-- Simpler scoring input (plans/02-tuyen-trach-vong-1/06-nhap-diem-don-gian.md).
-- A problem says where its values come from: MEASURED (scouts, devices, file import) or HLV (the head coach enters
-- them on the same station screen, live or at the end of the day from the notebook).
ALTER TABLE competition_assessment_steps ADD COLUMN score_source VARCHAR(10) NOT NULL DEFAULT 'MEASURED';

-- A score group is the average of its problems (source NULL) or the total of an earlier day (PREV_DAY + source_day_id).
-- The short-lived hand-scored group (scored_by = 'HLV', V35) is dropped: hand scores live on problems now.
ALTER TABLE competition_score_topics CHANGE COLUMN scored_by source VARCHAR(10) NULL;
UPDATE competition_score_topics SET source = NULL;
ALTER TABLE competition_score_topics ADD COLUMN source_day_id BIGINT NULL;
