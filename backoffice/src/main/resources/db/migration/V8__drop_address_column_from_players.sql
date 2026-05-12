-- Drop the address column from players table since we're using the addresses table instead
ALTER TABLE players DROP COLUMN address;
