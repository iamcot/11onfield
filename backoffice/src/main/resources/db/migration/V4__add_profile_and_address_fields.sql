-- Add Province table
CREATE TABLE IF NOT EXISTS provinces (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert all 34 provinces
INSERT INTO provinces (name, created_at, updated_at) VALUES
('Thành phố Hà Nội', NOW(), NOW()),
('Thành phố Hồ Chí Minh', NOW(), NOW()),
('Thành phố Hải Phòng', NOW(), NOW()),
('Thành phố Đà Nẵng', NOW(), NOW()),
('Thành phố Cần Thơ', NOW(), NOW()),
('Thành phố Huế', NOW(), NOW()),
('Tỉnh Cao Bằng', NOW(), NOW()),
('Tỉnh Hà Giang', NOW(), NOW()),
('Tỉnh Lào Cai', NOW(), NOW()),
('Tỉnh Sơn La', NOW(), NOW()),
('Tỉnh Điện Biên', NOW(), NOW()),
('Tỉnh Lai Châu', NOW(), NOW()),
('Tỉnh Lạng Sơn', NOW(), NOW()),
('Tỉnh Quảng Ninh', NOW(), NOW()),
('Tỉnh Bắc Ninh', NOW(), NOW()),
('Tỉnh Vĩnh Phúc', NOW(), NOW()),
('Tỉnh Phú Thọ', NOW(), NOW()),
('Tỉnh Thái Nguyên', NOW(), NOW()),
('Tỉnh Nghệ An', NOW(), NOW()),
('Tỉnh Thanh Hóa', NOW(), NOW()),
('Tỉnh Hà Tĩnh', NOW(), NOW()),
('Tỉnh Quảng Bình', NOW(), NOW()),
('Tỉnh Quảng Trị', NOW(), NOW()),
('Tỉnh Bình Định', NOW(), NOW()),
('Tỉnh Khánh Hòa', NOW(), NOW()),
('Tỉnh Đắk Lắk', NOW(), NOW()),
('Tỉnh Gia Lai', NOW(), NOW()),
('Tỉnh Kon Tum', NOW(), NOW()),
('Tỉnh Lâm Đồng', NOW(), NOW()),
('Tỉnh Bình Thuận', NOW(), NOW()),
('Tỉnh Đồng Nai', NOW(), NOW()),
('Tỉnh Tây Ninh', NOW(), NOW()),
('Tỉnh Kiên Giang', NOW(), NOW()),
('Tỉnh Cà Mau', NOW(), NOW());

-- Create Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    province_id BIGINT NOT NULL,
    address VARCHAR(500),
    ward VARCHAR(200),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add new fields to users table
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
ALTER TABLE users ADD COLUMN dob DATE;
ALTER TABLE users ADD COLUMN gender VARCHAR(10);

-- Add new fields to players table
ALTER TABLE players ADD COLUMN academy_id BIGINT;
ALTER TABLE players ADD COLUMN level VARCHAR(50);
ALTER TABLE players ADD COLUMN bio TEXT;

-- Verification
SELECT 'Migration V4 completed successfully!' AS status;
SELECT COUNT(*) AS province_count FROM provinces;
