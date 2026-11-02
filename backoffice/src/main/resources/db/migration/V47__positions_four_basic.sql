-- Positions: four codes only (striker, midfielder, defender, goalkeeper), one main position in `positions`
-- and at most one in `secondary_position`.

-- 1. "centerback" (Trung vệ) becomes defender (Hậu vệ), without a duplicate when the player had both.
UPDATE players SET positions = TRIM(BOTH ',' FROM REPLACE(CONCAT(',', REPLACE(positions, ' ', ''), ','), ',centerback,', ','))
WHERE CONCAT(',', REPLACE(positions, ' ', ''), ',') LIKE '%,centerback,%'
  AND CONCAT(',', REPLACE(positions, ' ', ''), ',') LIKE '%,defender,%';
UPDATE players SET positions = TRIM(BOTH ',' FROM REPLACE(CONCAT(',', REPLACE(positions, ' ', ''), ','), ',centerback,', ',defender,'))
WHERE CONCAT(',', REPLACE(positions, ' ', ''), ',') LIKE '%,centerback,%';
UPDATE players SET secondary_position = 'defender' WHERE secondary_position = 'centerback';

-- 2. Several positions: the first stays main, the second becomes the secondary when none was set, the rest is dropped.
UPDATE players
SET secondary_position = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(REPLACE(positions, ' ', ''), ',', 2), ',', -1))
WHERE positions LIKE '%,%' AND (secondary_position IS NULL OR secondary_position = '');
UPDATE players SET positions = TRIM(SUBSTRING_INDEX(REPLACE(positions, ' ', ''), ',', 1)) WHERE positions LIKE '%,%';
UPDATE players SET secondary_position = NULL WHERE secondary_position = positions;
UPDATE players SET positions = NULL WHERE positions = '';
