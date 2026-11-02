-- Only four positions remain: striker, midfielder, defender, goalkeeper. "centerback" (Trung vệ) becomes defender (Hậu vệ),
-- without a duplicate when the player had both.
UPDATE players SET positions = TRIM(BOTH ',' FROM REPLACE(CONCAT(',', REPLACE(positions, ' ', ''), ','), ',centerback,', ','))
WHERE CONCAT(',', REPLACE(positions, ' ', ''), ',') LIKE '%,centerback,%'
  AND CONCAT(',', REPLACE(positions, ' ', ''), ',') LIKE '%,defender,%';
UPDATE players SET positions = TRIM(BOTH ',' FROM REPLACE(CONCAT(',', REPLACE(positions, ' ', ''), ','), ',centerback,', ',defender,'))
WHERE CONCAT(',', REPLACE(positions, ' ', ''), ',') LIKE '%,centerback,%';
UPDATE players SET secondary_position = 'defender' WHERE secondary_position = 'centerback';
