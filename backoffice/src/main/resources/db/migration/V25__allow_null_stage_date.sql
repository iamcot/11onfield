-- A stage can be created before its date is decided; the website then shows "Đang cập nhật".
ALTER TABLE competition_stages MODIFY COLUMN stage_date DATE NULL;
