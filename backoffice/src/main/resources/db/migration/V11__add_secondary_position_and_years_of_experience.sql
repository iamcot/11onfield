-- Add secondary_position and years_of_experience to players table
ALTER TABLE players
ADD COLUMN secondary_position VARCHAR(50),
ADD COLUMN years_of_experience INT;
