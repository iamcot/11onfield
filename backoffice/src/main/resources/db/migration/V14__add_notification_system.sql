-- Migration V14: Add Multi-Channel Notification System
-- Tables: notification_scenarios, notification_templates, notifications

-- Table 1: notification_scenarios (Master configuration for notification types)
CREATE TABLE notification_scenarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scenario_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    email_enabled BOOLEAN DEFAULT FALSE,
    inapp_enabled BOOLEAN DEFAULT TRUE,
    zns_enabled BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: notification_templates (Template storage per channel with variable substitution)
CREATE TABLE notification_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scenario_id BIGINT NOT NULL,
    channel VARCHAR(10) NOT NULL, -- EMAIL, INAPP, ZNS
    subject VARCHAR(200),
    body_template TEXT NOT NULL,
    variables JSON, -- ["fullName", "email", "achievementTitle"]
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES notification_scenarios(id) ON DELETE CASCADE,
    INDEX idx_scenario_channel (scenario_id, channel, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: notifications (Permanent notification storage)
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    scenario_key VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON, -- {"achievementId": 123, "eventId": 456}
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    read_at DATETIME(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_user_unread (user_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification scenarios
INSERT INTO notification_scenarios (scenario_key, name, description, email_enabled, inapp_enabled, zns_enabled, created_at, updated_at) VALUES
('WELCOME_EMAIL', 'Chào mừng', 'Gửi email chào mừng khi người dùng điền email lần đầu', TRUE, TRUE, FALSE, NOW(6), NOW(6)),
('ACHIEVEMENT_APPROVED', 'Thành tích được duyệt', 'Thông báo khi admin duyệt thành tích của cầu thủ', FALSE, TRUE, TRUE, NOW(6), NOW(6)),
('HIGHLIGHT_APPROVED', 'Highlight được duyệt', 'Thông báo khi admin duyệt highlight của cầu thủ', FALSE, TRUE, TRUE, NOW(6), NOW(6)),
('EVENT_JOINED', 'Xác nhận tham gia sự kiện', 'Xác nhận khi người dùng đăng ký tham gia sự kiện', FALSE, TRUE, FALSE, NOW(6), NOW(6)),
('NEW_FOLLOWER', 'Người theo dõi mới', 'Thông báo khi có người theo dõi mới', FALSE, TRUE, FALSE, NOW(6), NOW(6));

-- Insert default templates for WELCOME_EMAIL scenario
INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'EMAIL', 'Chào mừng bạn đến với 11 On Field!',
'<html><body><h2>Xin chào {{fullName}}!</h2><p>Chúng tôi rất vui mừng chào đón bạn đến với cộng đồng 11 On Field - nền tảng kết nối cầu thủ bóng đá Việt Nam.</p><p>Email của bạn ({{email}}) đã được xác nhận thành công. Bây giờ bạn có thể nhận thông báo về các sự kiện, thành tích và cập nhật quan trọng từ chúng tôi.</p><p>Chúc bạn có những trải nghiệm tuyệt vời!</p><p><strong>Đội ngũ 11 On Field</strong></p></body></html>',
'["fullName", "email"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'WELCOME_EMAIL';

INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Chào mừng bạn đến với 11 On Field!',
'Xin chào {{fullName}}! Email {{email}} của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',
'["fullName", "email"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'WELCOME_EMAIL';

-- Insert default templates for ACHIEVEMENT_APPROVED scenario
INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Thành tích được duyệt',
'Chúc mừng {{fullName}}! Thành tích "{{achievementTitle}}" của bạn đã được admin duyệt và hiển thị trên hồ sơ.',
'["fullName", "achievementTitle"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'ACHIEVEMENT_APPROVED';

INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'ZNS', '',
'Chuc mung {{fullName}}! Thanh tich "{{achievementTitle}}" cua ban da duoc duyet.',
'["fullName", "achievementTitle"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'ACHIEVEMENT_APPROVED';

-- Insert default templates for HIGHLIGHT_APPROVED scenario
INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Highlight được duyệt',
'Chúc mừng {{fullName}}! Highlight "{{highlightDescription}}" của bạn đã được admin duyệt.',
'["fullName", "highlightDescription"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'HIGHLIGHT_APPROVED';

INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'ZNS', '',
'Chuc mung {{fullName}}! Highlight cua ban da duoc duyet.',
'["fullName", "highlightDescription"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'HIGHLIGHT_APPROVED';

-- Insert default templates for EVENT_JOINED scenario
INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Xác nhận tham gia sự kiện',
'Xin chào {{fullName}}! Bạn đã đăng ký tham gia sự kiện "{{eventTitle}}" vào ngày {{eventDate}}. Chúng tôi sẽ gửi thông báo nhắc nhở trước khi sự kiện diễn ra.',
'["fullName", "eventTitle", "eventDate"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'EVENT_JOINED';

-- Insert default templates for NEW_FOLLOWER scenario
INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Người theo dõi mới',
'{{followerName}} (@{{followerUserid}}) đã bắt đầu theo dõi bạn!',
'["followerName", "followerUserid"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'NEW_FOLLOWER';
