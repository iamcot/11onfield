-- Common faults of a test (e.g. "Va cọc", "Trượt chân"), one per line, set by the admin when setting up the test.
-- The scoring screen offers "Lỗi" only for tests that list some; the others only have "Không thi".
ALTER TABLE competition_assessments ADD COLUMN fault_reasons VARCHAR(500) NULL;
