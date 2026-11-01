-- Someone who is not signed in can apply too. Without an account the application keeps the
-- name and contact the guest typed, so 11of can reach them and tell them when it is passed on.
ALTER TABLE event_registrations MODIFY COLUMN user_id BIGINT NULL;
ALTER TABLE event_registrations ADD COLUMN guest_name VARCHAR(200) NULL;
ALTER TABLE event_registrations ADD COLUMN guest_phone VARCHAR(30) NULL;
ALTER TABLE event_registrations ADD COLUMN guest_email VARCHAR(200) NULL;
CREATE INDEX idx_event_registration_guest_phone ON event_registrations (event_id, guest_phone);
