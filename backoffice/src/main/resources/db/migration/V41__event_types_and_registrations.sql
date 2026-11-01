-- Events get a type. A "Tuyển sinh" (RECRUITMENT) event carries a registration form the admin builds
-- (form_schema, JSON list of fields) and the name of the unit the applications are passed on to.
ALTER TABLE events ADD COLUMN event_type VARCHAR(20) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE events ADD COLUMN partner_name VARCHAR(200) NULL;
ALTER TABLE events ADD COLUMN form_schema TEXT NULL;

-- One application per player per event. `answers` keeps a snapshot of each field (label + value),
-- so the PDF still reads the same after the admin changes the form.
CREATE TABLE event_registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    answers TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    forwarded_at DATETIME(6) NULL,
    forwarded_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_event_registration UNIQUE (event_id, user_id),
    CONSTRAINT fk_event_registration_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_registration_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_registration_forwarder FOREIGN KEY (forwarded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_registration_event (event_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The player hears about their application twice: when it is received, and when 11of has passed it on.
INSERT INTO notification_scenarios (scenario_key, name, description, email_enabled, inapp_enabled, zns_enabled, created_at, updated_at) VALUES
('EVENT_REGISTRATION_SUBMITTED', 'Đã nhận hồ sơ tuyển sinh', 'Gửi cho cầu thủ khi 11of nhận được hồ sơ đăng ký sự kiện tuyển sinh', FALSE, TRUE, FALSE, NOW(6), NOW(6)),
('EVENT_REGISTRATION_FORWARDED', 'Đã chuyển hồ sơ tuyển sinh', 'Gửi cho cầu thủ khi admin đã chuyển hồ sơ sang đơn vị tuyển sinh', TRUE, TRUE, FALSE, NOW(6), NOW(6));

INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Đã nhận hồ sơ đăng ký',
'Xin chào {{fullName}}! 11of đã nhận hồ sơ của bạn cho sự kiện "{{eventTitle}}". Chúng tôi sẽ báo bạn khi hồ sơ được chuyển tới {{partnerName}}.',
'["fullName", "eventTitle", "partnerName"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'EVENT_REGISTRATION_SUBMITTED';

INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Hồ sơ đã được chuyển',
'Hồ sơ của bạn cho sự kiện "{{eventTitle}}" đã được 11of chuyển tới {{partnerName}}. Đơn vị sẽ liên hệ với bạn trong thời gian tới.',
'["fullName", "eventTitle", "partnerName"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'EVENT_REGISTRATION_FORWARDED';

INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'EMAIL', 'Hồ sơ "{{eventTitle}}" của bạn đã được chuyển',
'<html><body><h2>Xin chào {{fullName}}!</h2><p>11 On Field đã chuyển hồ sơ đăng ký của bạn cho sự kiện <strong>{{eventTitle}}</strong> tới <strong>{{partnerName}}</strong>.</p><p>Đơn vị tuyển sinh sẽ liên hệ trực tiếp với bạn qua số điện thoại hoặc email trong hồ sơ. Bạn có thể xem lại hồ sơ đã gửi tại trang sự kiện: <a href="{{eventUrl}}">{{eventUrl}}</a></p><p>Chúc bạn may mắn!</p><p><strong>Đội ngũ 11 On Field</strong></p></body></html>',
'["fullName", "eventTitle", "partnerName", "eventUrl"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'EVENT_REGISTRATION_FORWARDED';
