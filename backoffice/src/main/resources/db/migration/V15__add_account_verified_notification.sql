-- Migration V15: Add ACCOUNT_VERIFIED notification scenario
-- Add new notification scenario for account verification

-- Insert ACCOUNT_VERIFIED scenario
INSERT INTO notification_scenarios (scenario_key, name, description, email_enabled, inapp_enabled, zns_enabled, created_at, updated_at) VALUES
('ACCOUNT_VERIFIED', 'Tài khoản đã xác minh', 'Thông báo khi admin xác minh tài khoản cầu thủ', FALSE, TRUE, FALSE, NOW(6), NOW(6));

-- Insert INAPP template for ACCOUNT_VERIFIED
INSERT INTO notification_templates (scenario_id, channel, subject, body_template, variables, active, created_at, updated_at)
SELECT id, 'INAPP', 'Tài khoản đã được xác minh',
'Chúc mừng {{fullName}}! Tài khoản của bạn đã được admin xác minh. Bạn có thể sử dụng đầy đủ các tính năng của nền tảng.',
'["fullName"]', TRUE, NOW(6), NOW(6)
FROM notification_scenarios WHERE scenario_key = 'ACCOUNT_VERIFIED';
