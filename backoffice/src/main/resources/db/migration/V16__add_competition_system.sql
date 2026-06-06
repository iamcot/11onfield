-- V16: Add Competition System
-- Creates tables for annual TV competition with multi-stage selection process
-- Tables: competitions, competition_stages, competition_participants, stage_results, competition_news, competition_sponsors

-- 1. Create competitions table
CREATE TABLE competitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    season INT NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    picture VARCHAR(500),
    status VARCHAR(50) NOT NULL,
    current_phase VARCHAR(50),
    registration_start_date DATE,
    registration_end_date DATE,
    competition_start_date DATE NOT NULL,
    competition_end_date DATE NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    INDEX idx_season (season),
    INDEX idx_status (status),
    INDEX idx_current_phase (current_phase)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create competition_stages table
CREATE TABLE competition_stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    stage_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    stage_date DATE NOT NULL,
    stage_time VARCHAR(10),
    stage_type VARCHAR(50) NOT NULL,
    region VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    is_public_scoring BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_competition_stage (competition_id, stage_number),
    INDEX idx_competition_type_region (competition_id, stage_type, region),
    INDEX idx_stage_date (stage_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create competition_participants table
CREATE TABLE competition_participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    enrollment_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    selected_region VARCHAR(50),
    registration_date DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_competition_user (competition_id, user_id),
    INDEX idx_competition_status (competition_id, status),
    INDEX idx_user (user_id),
    INDEX idx_selected_region (selected_region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create stage_results table
CREATE TABLE stage_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    score DECIMAL(10,2),
    rank_position INT,
    performance_notes TEXT,
    video_url VARCHAR(500),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (stage_id) REFERENCES competition_stages(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES competition_participants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_stage_participant (stage_id, participant_id),
    INDEX idx_stage_rank (stage_id, rank_position),
    INDEX idx_participant (participant_id),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create competition_news table
CREATE TABLE competition_news (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    thumbnail VARCHAR(500),
    author_user_id BIGINT,
    published_at DATETIME(6),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_competition_published (competition_id, published_at DESC, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create competition_sponsors table
CREATE TABLE competition_sponsors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    INDEX idx_competition_order (competition_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Insert Season 1 competition
INSERT INTO competitions (season, title, description, status, current_phase, registration_start_date, registration_end_date, competition_start_date, competition_end_date, created_at, updated_at)
VALUES (1, '11 of - Mùa 1', 'Mùa đầu tiên của giải đấu 11 of - Tìm kiếm tài năng bóng đá từ đường phố', 'DRAFT', 'REGISTRATION', '2026-05-01', '2026-06-15', '2026-06-01', '2026-09-30', NOW(), NOW());

-- 8. Create stages for Season 1 (15 stages total)
INSERT INTO competition_stages (competition_id, stage_number, stage_type, region, title, stage_date, status, is_public_scoring, created_at, updated_at)
VALUES
-- Regional auditions (3 stages)
(1, 1, 'REGIONAL_AUDITION', 'HANOI_NORTH', 'Vòng tuyển trạch Hà Nội và khu vực phía Bắc', '2026-06-01', 'UPCOMING', TRUE, NOW(), NOW()),
(1, 2, 'REGIONAL_AUDITION', 'DANANG_CENTRAL', 'Vòng tuyển trạch Đà Nẵng và khu vực miền Trung Tây Nguyên', '2026-06-08', 'UPCOMING', TRUE, NOW(), NOW()),
(1, 3, 'REGIONAL_AUDITION', 'HCMC_SOUTH', 'Vòng tuyển trạch TP HCM và khu vực miền Nam', '2026-06-15', 'UPCOMING', TRUE, NOW(), NOW()),
-- Training episodes (11 stages)
(1, 4, 'TRAINING_EPISODE', NULL, 'Tập 1', '2026-07-01', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 5, 'TRAINING_EPISODE', NULL, 'Tập 2', '2026-07-08', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 6, 'TRAINING_EPISODE', NULL, 'Tập 3', '2026-07-15', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 7, 'TRAINING_EPISODE', NULL, 'Tập 4', '2026-07-22', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 8, 'TRAINING_EPISODE', NULL, 'Tập 5', '2026-07-29', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 9, 'TRAINING_EPISODE', NULL, 'Tập 6', '2026-08-05', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 10, 'TRAINING_EPISODE', NULL, 'Tập 7', '2026-08-12', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 11, 'TRAINING_EPISODE', NULL, 'Tập 8', '2026-08-19', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 12, 'TRAINING_EPISODE', NULL, 'Tập 9', '2026-08-26', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 13, 'TRAINING_EPISODE', NULL, 'Tập 10', '2026-09-09', 'UPCOMING', FALSE, NOW(), NOW()),
(1, 14, 'TRAINING_EPISODE', NULL, 'Tập 11', '2026-09-16', 'UPCOMING', FALSE, NOW(), NOW()),
-- Final match (1 stage)
(1, 15, 'FINAL_MATCH', NULL, 'Chung kết', '2026-09-30', 'UPCOMING', TRUE, NOW(), NOW());

-- 9. Auto-enroll all existing PLAYER users in Season 1
INSERT INTO competition_participants (competition_id, user_id, enrollment_type, status, registration_date, created_at, updated_at)
SELECT 1, u.id, 'AUTO_ENROLLED', 'REGISTERED', NOW(), NOW(), NOW()
FROM users u
WHERE u.role = 'PLAYER' AND u.enabled = TRUE;

-- 10. Add notification scenarios for competition (use INSERT IGNORE to skip if already exist)
INSERT IGNORE INTO notification_scenarios (scenario_key, name, description, email_enabled, inapp_enabled, zns_enabled, created_at, updated_at)
VALUES
('COMPETITION_RESULT_POSTED', 'Kết quả vòng tuyển trạch', 'Thông báo kết quả vòng tuyển trạch khu vực', TRUE, TRUE, TRUE, NOW(), NOW()),
('COMPETITION_SELECTED_TOP30', 'Chọn vào TOP 30', 'Thông báo được chọn vào vòng đào tạo TOP 30', TRUE, TRUE, TRUE, NOW(), NOW()),
('COMPETITION_SELECTED_TOP11', 'Chọn vào Chung kết', 'Thông báo được chọn vào vòng Chung kết TOP 11', TRUE, TRUE, TRUE, NOW(), NOW()),
('COMPETITION_REGISTERED', 'Đăng ký tham gia cuộc thi', 'Xác nhận đăng ký tham gia cuộc thi thành công', TRUE, TRUE, FALSE, NOW(), NOW());
