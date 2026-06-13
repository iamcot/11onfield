-- V23: Auto-enroll existing players into the current active competition
-- Fixes players who registered before auto-enrollment was implemented
-- Only enrolls players who are not already participants

INSERT INTO competition_participants (competition_id, user_id, enrollment_type, status, registration_date, created_at, updated_at)
SELECT
    c.id,
    u.id,
    'AUTO_ENROLLED',
    'REGISTERED',
    NOW(),
    NOW(),
    NOW()
FROM users u
INNER JOIN players p ON p.id = u.id
INNER JOIN competitions c ON c.status IN ('REGISTRATION_OPEN', 'REGIONAL_AUDITION')
WHERE u.role = 'PLAYER'
  AND u.enabled = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM competition_participants cp
      WHERE cp.competition_id = c.id
        AND cp.user_id = u.id
  );
