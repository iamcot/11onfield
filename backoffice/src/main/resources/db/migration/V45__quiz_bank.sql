-- Football quiz practice, phase 1: the question bank. AI writes questions through AnyLearn's gateway,
-- an editor reviews them in /quan-tri before players see them.

CREATE TABLE quiz_topics (
    topic_key    VARCHAR(30)  NOT NULL PRIMARY KEY,
    label        VARCHAR(80)  NOT NULL,
    topic_group  VARCHAR(20)  NOT NULL DEFAULT 'knowledge',  -- knowledge | thinking | situation
    hint         VARCHAR(500) NOT NULL,                      -- what the AI writes about
    with_diagram TINYINT      NOT NULL DEFAULT 0,            -- AI draws a pitch diagram for every question
    sort_order   INT          NOT NULL DEFAULT 0,
    active       TINYINT      NOT NULL DEFAULT 1,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE quiz_questions (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    topic         VARCHAR(30)  NOT NULL,
    difficulty    TINYINT      NOT NULL,                    -- 1 very easy .. 5 very hard
    pool          VARCHAR(10)  NOT NULL DEFAULT 'practice', -- practice | exam (exam questions never show in practice)
    body          VARCHAR(600) NOT NULL,
    opt_a         VARCHAR(200) NOT NULL,
    opt_b         VARCHAR(200) NOT NULL,
    opt_c         VARCHAR(200) NOT NULL,
    opt_d         VARCHAR(200) NOT NULL,
    correct       TINYINT      NOT NULL,                    -- 0..3
    explanation   VARCHAR(600) NULL,
    media_type    VARCHAR(10)  NOT NULL DEFAULT 'none',     -- none | diagram | image
    diagram       TEXT         NULL,                        -- pitch diagram JSON, see QuizDiagram
    media_url     VARCHAR(500) NULL,
    hash          CHAR(64)     NOT NULL,
    status        VARCHAR(10)  NOT NULL DEFAULT 'pending',  -- pending | active | hidden
    verified      TINYINT      NOT NULL DEFAULT 0,          -- 1 AI blind answer agreed, -1 disagreed, 0 not checked
    review_note   VARCHAR(200) NULL,
    report_count  INT          NOT NULL DEFAULT 0,
    times_served  INT          NOT NULL DEFAULT 0,
    times_correct INT          NOT NULL DEFAULT 0,
    source        VARCHAR(10)  NOT NULL DEFAULT 'ai',       -- ai | manual
    model         VARCHAR(60)  NULL,
    created_by    VARCHAR(100) NULL,
    reviewed_by   VARCHAR(100) NULL,
    reviewed_at   DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_quiz_questions_hash (hash),
    KEY idx_quiz_questions_cell (status, pool, topic, difficulty)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE quiz_question_reports (
    question_id BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    reason      VARCHAR(30)  NOT NULL,
    note        VARCHAR(200) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (question_id, user_id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE quiz_gen_runs (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    topic         VARCHAR(30)  NOT NULL,
    difficulty    TINYINT      NOT NULL,
    pool          VARCHAR(10)  NOT NULL DEFAULT 'practice',
    requested     INT          NOT NULL,
    returned      INT          NOT NULL DEFAULT 0,
    invalid       INT          NOT NULL DEFAULT 0,
    duplicates    INT          NOT NULL DEFAULT 0,
    saved         INT          NOT NULL DEFAULT 0,
    verify_failed INT          NOT NULL DEFAULT 0,
    input_tokens  INT          NOT NULL DEFAULT 0,
    output_tokens INT          NOT NULL DEFAULT 0,
    error         VARCHAR(200) NULL,
    created_by    VARCHAR(100) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_quiz_gen_runs_created (created_at)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO quiz_topics (topic_key, label, topic_group, hint, with_diagram, sort_order) VALUES
('laws', 'Luật thi đấu', 'knowledge',
 'Luật thi đấu bóng đá 11 người theo IFAB Laws of the Game hiện hành: việt vị, phạt trực tiếp và gián tiếp, phạt đền, thẻ phạt, VAR, ném biên, phạt góc, thủ môn. Giải thích phải nêu điều luật liên quan (ví dụ "Luật 11").', 1, 10),
('history', 'Lịch sử và văn hóa bóng đá', 'knowledge',
 'Lịch sử và văn hóa bóng đá thế giới và Việt Nam: World Cup, EURO, Asian Cup, AFF Cup, SEA Games, các đội tuyển và câu lạc bộ lớn, cầu thủ huyền thoại. Chỉ hỏi sự kiện đã được ghi nhận chính thức, có năm và số liệu chắc chắn.', 0, 20),
('fitness', 'Thể lực, dinh dưỡng, phục hồi', 'knowledge',
 'Kiến thức thể lực cho cầu thủ trẻ 16-21 tuổi: khởi động, sức bền, sức mạnh, tốc độ, phòng tránh và xử lý chấn thương thường gặp, dinh dưỡng, ngủ và phục hồi. Theo khuyến nghị y học thể thao phổ biến, không đưa lời khuyên y tế cá nhân.', 0, 30),
('tactics', 'Chiến thuật và đội hình', 'thinking',
 'Chiến thuật bóng đá hiện đại: sơ đồ đội hình (4-3-3, 4-2-3-1, 3-5-2...), nhiệm vụ từng vị trí, pressing, chuyển trạng thái, phòng ngự khu vực, tạo khoảng trống, bóng cố định. Mỗi câu có một lựa chọn tốt nhất theo nguyên lý huấn luyện phổ biến.', 1, 40),
('mindset', 'Tâm lý và bản lĩnh', 'thinking',
 'Tâm lý thi đấu của cầu thủ trẻ: xử lý áp lực, sau sai lầm, khi bị phạm lỗi hay khiêu khích, kỷ luật, tinh thần đồng đội, giao tiếp với HLV, trọng tài và đồng đội. Lựa chọn tốt nhất là cách ứng xử chuyên nghiệp được các HLV đồng thuận.', 0, 50),
('reading', 'Đọc tình huống trên sân', 'situation',
 'Tình huống cụ thể trong trận: người chơi ở một vị trí (ví dụ hậu vệ trái, tiền vệ trung tâm, tiền đạo), mô tả vị trí đồng đội, đối thủ và bóng, hỏi nên làm gì tiếp theo (chuyền, rê, sút, lùi về, áp sát, chạy chỗ). Lựa chọn tốt nhất theo nguyên lý chiến thuật, ba lựa chọn còn lại hợp lý nhưng kém hơn rõ ràng.', 1, 60),
('conduct', 'Kỹ năng mềm và truyền thông', 'situation',
 'Ứng xử của cầu thủ trẻ ngoài sân: trả lời phỏng vấn, mạng xã hội, người hâm mộ, nhà tài trợ, giữ hình ảnh, cân bằng học tập và tập luyện, làm việc nhóm. Lựa chọn tốt nhất là cách ứng xử chuyên nghiệp, tôn trọng.', 0, 70);
