ALTER TABLE competition_sponsors ADD COLUMN ad_position VARCHAR(50) NULL AFTER is_active;
ALTER TABLE competition_sponsors ADD COLUMN banner_image_url VARCHAR(500) NULL AFTER ad_position;
