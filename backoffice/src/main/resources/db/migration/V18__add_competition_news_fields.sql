ALTER TABLE competition_news ADD COLUMN short_content TEXT NULL AFTER content;
ALTER TABLE competition_news ADD COLUMN author_byline VARCHAR(200) NULL AFTER short_content;
