-- A score group is either the sum of its problems' 1-5 levels (scored_by NULL) or entered by hand after the exam by
-- the head coach (scored_by = 'HLV'), e.g. duels, mindset, media on day 1. Hand scores live in manual_scores under
-- component_key 'TOPIC_<topic id>'.
ALTER TABLE competition_score_topics ADD COLUMN scored_by VARCHAR(10) NULL;
