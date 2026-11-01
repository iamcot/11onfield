-- The brand is "11 On Field": the recruitment notifications from V41 said "11of".
UPDATE notification_templates
SET body_template = REPLACE(body_template, '11of ', '11 On Field '), updated_at = NOW(6)
WHERE body_template LIKE '%11of %';

UPDATE notification_scenarios
SET description = REPLACE(description, '11of ', '11 On Field '), updated_at = NOW(6)
WHERE description LIKE '%11of %';
