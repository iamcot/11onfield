-- SBD (số báo danh) stored once and never changed. Before this it was the position in the list of valid contestants,
-- so approving or removing someone shifted everyone after them. A number is per competition (one competition = one
-- season), assigned when the registration first becomes valid, and kept even if the person later withdraws.
ALTER TABLE competition_participants ADD COLUMN sbd INT NULL;
ALTER TABLE competition_participants ADD CONSTRAINT uk_participant_sbd UNIQUE (competition_id, sbd);

-- Backfill with the numbers shown today, so nothing printed so far changes.
UPDATE competition_participants cp
JOIN (
    SELECT p.id, ROW_NUMBER() OVER (PARTITION BY p.competition_id ORDER BY p.registration_date, p.id) AS n
    FROM competition_participants p
    JOIN users u ON u.id = p.user_id
    JOIN players pl ON pl.id = u.id
    WHERE u.role = 'PLAYER' AND u.enabled = 1 AND pl.verified = 1 AND p.status <> 'WITHDRAWN'
) x ON x.id = cp.id
SET cp.sbd = x.n;
