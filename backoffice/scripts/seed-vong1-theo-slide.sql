-- ============================================================================
-- Seed: bài thi Ngày 1 và Ngày 2 của vòng tuyển trạch, theo slide "Quy trình tuyển trạch" (21 slide).
--
-- Cách chạy (đổi 2 số: id giải và số thứ tự vòng):
--   mysql -u<user> -p <db> < backoffice/scripts/seed-vong1-theo-slide.sql
--   mysql -u<user> -p <db> --default-character-set=utf8mb4 -e "CALL seed_vong_theo_slide(<competition_id>, <stage_number>)"
--
-- Script chỉ tạo khi vòng CHƯA có ngày thi nào, để không đụng dữ liệu đã nhập (xoá ngày thi sẽ xoá cả số đo).
-- Muốn tạo lại thì xoá các ngày thi của vòng trên màn "Bài thi và thang điểm" trước.
--
-- Những ngưỡng slide không ghi số, script tự đặt tạm và ghi chú "(ngưỡng tạm)" trong mô tả bài:
--   - Chỉ số cơ thể (slide 2 chỉ có 5 màu), Agility (slide 5 chỉ ghi Xanh < 15,2 s),
--   - Football IQ mức Cam/Đỏ, Bản lĩnh và Truyền thông (HLV chấm theo mức 1–5).
-- Ưu tiên đồng điểm theo slide 12: Tư duy > Kỷ luật > Thể chất. Kỷ luật luôn xét sau các nhóm điểm, nên thứ tự
-- ở đây là Tư duy & tâm lý (1), Thể hình (2), Thể lực (3).
-- ============================================================================

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS seed_vong_theo_slide;
DROP PROCEDURE IF EXISTS sd_step;
DROP PROCEDURE IF EXISTS sd_content;
DROP PROCEDURE IF EXISTS sd_band;

DELIMITER //

-- Một bài thi kèm thang 5 mức trống (Xám → Xanh). Kết quả: @step.
CREATE PROCEDURE sd_step(IN p_day BIGINT, IN p_no INT, IN p_title VARCHAR(200), IN p_desc TEXT,
                         IN p_topic BIGINT, IN p_source VARCHAR(10))
BEGIN
    INSERT INTO competition_assessment_steps
        (assessment_day_id, step_number, title, description, display_order, has_rating_scale,
         is_scored, audience, topic_id, score_source)
    VALUES (p_day, p_no, p_title, p_desc, p_no, TRUE, TRUE, 'ALL', p_topic, p_source);
    SET @step = LAST_INSERT_ID();
    INSERT INTO competition_assessment_step_ratings (assessment_step_id, level, threshold_type, description, color, action)
    VALUES (@step, 1, NULL, 'Xám', 'GREY', 'NONE'),
           (@step, 2, NULL, 'Đỏ', 'RED', 'NONE'),
           (@step, 3, NULL, 'Cam', 'ORANGE', 'NONE'),
           (@step, 4, NULL, 'Vàng', 'YELLOW', 'NONE'),
           (@step, 5, NULL, 'Xanh', 'GREEN', 'NONE');
END //

-- Một nội dung thi của bài @step. Kết quả: @a.
CREATE PROCEDURE sd_content(IN p_no INT, IN p_title VARCHAR(200), IN p_unit VARCHAR(50), IN p_attempts INT,
                            IN p_method VARCHAR(20), IN p_dir VARCHAR(10), IN p_type VARCHAR(12),
                            IN p_min DECIMAL(10,3), IN p_max DECIMAL(10,3))
BEGIN
    INSERT INTO competition_assessments
        (assessment_step_id, assessment_number, title, unit, attempts_count, scoring_method, display_order,
         direction, value_type, plausible_min, plausible_max)
    VALUES (@step, p_no, p_title, p_unit, p_attempts, p_method, p_no, p_dir, p_type, p_min, p_max);
    SET @a = LAST_INSERT_ID();
END //

-- Điều kiện của nội dung @a ở một mức của bài @step (cận gồm cả hai đầu, NULL = không giới hạn).
CREATE PROCEDURE sd_band(IN p_level INT, IN p_min DECIMAL(10,3), IN p_max DECIMAL(10,3))
BEGIN
    INSERT INTO competition_rating_conditions (rating_id, assessment_id, range_min, range_max)
    SELECT r.id, @a, p_min, p_max FROM competition_assessment_step_ratings r
    WHERE r.assessment_step_id = @step AND r.level = p_level;
END //

CREATE PROCEDURE seed_vong_theo_slide(IN p_competition BIGINT, IN p_stage_number INT)
BEGIN
    DECLARE v_stage BIGINT;
    DECLARE v_day1 BIGINT;
    DECLARE v_day2 BIGINT;
    DECLARE t_hinh, t_luc, t_kythuat, t_doikhang, t_tuduy, t_truyenthong BIGINT;
    DECLARE t_ngay1, t_gps, t_bhl, t_tuduy2 BIGINT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    SELECT id INTO v_stage FROM competition_stages
    WHERE competition_id = p_competition AND stage_number = p_stage_number;
    IF v_stage IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không tìm thấy vòng này của giải';
    END IF;
    IF EXISTS (SELECT 1 FROM competition_assessment_days WHERE stage_id = v_stage) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vòng đã có ngày thi, xoá các ngày thi trước khi seed lại';
    END IF;

    START TRANSACTION;

    -- ======================= NGÀY 1 (slide 1–12) =======================
    INSERT INTO competition_assessment_days (stage_id, day_number, title, description, display_order)
    VALUES (v_stage, 1, 'Thể lực, kỹ thuật, tâm lý',
            '100 điểm, 100% dữ liệu nhập từ máy (laser, radar). Top 110 đi tiếp ngày 2.', 1);
    SET v_day1 = LAST_INSERT_ID();

    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day1, 'THE_HINH', 'Thể hình', 10, 1, 2);
    SET t_hinh = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day1, 'THE_LUC', 'Thể lực', 10, 2, 3);
    SET t_luc = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day1, 'KY_THUAT_CA_NHAN', 'Kỹ thuật cá nhân', 20, 3, NULL);
    SET t_kythuat = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day1, 'HIEU_SUAT_DOI_KHANG', 'Hiệu suất đối kháng', 20, 4, NULL);
    SET t_doikhang = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day1, 'TU_DUY_TAM_LY', 'Tư duy & tâm lý', 20, 5, 1);
    SET t_tuduy = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day1, 'TRUYEN_THONG', 'Truyền thông & hình ảnh', 20, 6, NULL);
    SET t_truyenthong = LAST_INSERT_ID();

    -- B1 · Đăng ký & chỉ số cơ thể (slide 2). Slide chỉ có 5 màu, chưa có số.
    CALL sd_step(v_day1, 1, 'Chỉ số cơ thể',
                 'B1 Registration: đo cơ/mỡ và BMI. (ngưỡng tạm) Mức theo tỉ lệ mỡ; BMI chỉ ghi lại.', t_hinh, 'MEASURED');
    CALL sd_content(1, 'Tỉ lệ mỡ', '%', 1, 'BEST_OF', 'LOWER', 'NUMBER', 3, 35);
    CALL sd_band(5, NULL, 10);
    CALL sd_band(4, 10.1, 13);
    CALL sd_band(3, 13.1, 16);
    CALL sd_band(2, 16.1, 20);
    CALL sd_content(2, 'BMI', 'kg/m²', 1, 'BEST_OF', 'HIGHER', 'NUMBER', 14, 35);

    -- B3 · Sprint 30 m (slide 4): 2 lượt, lấy lượt tốt nhất.
    CALL sd_step(v_day1, 2, 'Sprint 30m', 'B3: chạy 30 m, cổng laser, 2 lượt lấy lượt nhanh nhất.', t_luc, 'MEASURED');
    CALL sd_content(1, 'Thời gian 30m', 's', 2, 'BEST_OF', 'LOWER', 'NUMBER', 3, 8);
    CALL sd_band(5, NULL, 4.10);
    CALL sd_band(4, 4.11, 4.40);
    CALL sd_band(3, 4.41, 4.70);
    CALL sd_band(2, 4.71, 5.00);

    -- B4 · Agility (slide 5): slide chỉ ghi Xanh < 15,2 s.
    CALL sd_step(v_day1, 3, 'Agility',
                 'B4: luồn cọc chuyển hướng, 2 lượt. (ngưỡng tạm) Slide chỉ ghi Xanh < 15,2 s.', t_kythuat, 'MEASURED');
    CALL sd_content(1, 'Thời gian agility', 's', 2, 'BEST_OF', 'LOWER', 'NUMBER', 10, 30);
    -- Lỗi hay gặp của bài luồn cọc: chỉ bài có khai báo lỗi mới có nút "Lỗi" ở màn chấm điểm.
    UPDATE competition_assessments SET fault_reasons = CONCAT('Va cọc', CHAR(10), 'Trượt chân') WHERE id = @a;
    CALL sd_band(5, NULL, 15.19);
    CALL sd_band(4, 15.2, 16.5);
    CALL sd_band(3, 16.51, 17.8);
    CALL sd_band(2, 17.81, 19.0);

    -- B5 · Bật cao (slide 6).
    CALL sd_step(v_day1, 4, 'Bật cao', 'B5 Vertical jump: 2 lượt lấy lượt cao nhất.', t_luc, 'MEASURED');
    CALL sd_content(1, 'Độ cao bật', 'cm', 2, 'BEST_OF', 'HIGHER', 'NUMBER', 15, 100);
    CALL sd_band(5, 61, NULL);
    CALL sd_band(4, 56, 60.9);
    CALL sd_band(3, 51, 55.9);
    CALL sd_band(2, 46, 50.9);

    -- B6 · Bật xa (slide 7).
    CALL sd_step(v_day1, 5, 'Bật xa', 'B6 Long jump: 2 lượt lấy lượt xa nhất.', t_luc, 'MEASURED');
    CALL sd_content(1, 'Độ xa', 'm', 2, 'BEST_OF', 'HIGHER', 'NUMBER', 1, 3.5);
    CALL sd_band(5, 2.50, NULL);
    CALL sd_band(4, 2.20, 2.49);
    CALL sd_band(3, 1.90, 2.19);
    CALL sd_band(2, 1.70, 1.89);

    -- B7 · Sút (slide 9): 5 cú, radar đo tốc độ, đếm số cú trúng đích. Phải đạt cả hai điều kiện của mức.
    CALL sd_step(v_day1, 6, 'Lực sút', 'B7 Shot power: 5 cú, lấy tốc độ cao nhất và số cú trúng đích.', t_kythuat, 'MEASURED');
    CALL sd_content(1, 'Tốc độ sút', 'km/h', 5, 'BEST_OF', 'HIGHER', 'NUMBER', 30, 150);
    CALL sd_band(5, 110.1, NULL);
    CALL sd_band(4, 96, 110);
    CALL sd_band(3, 80, 95.9);
    CALL sd_band(2, 65, 79.9);
    CALL sd_content(2, 'Số cú trúng đích', 'cú', 1, 'BEST_OF', 'HIGHER', 'COUNT', 0, 5);
    CALL sd_band(5, 5, NULL);
    CALL sd_band(4, 4, 4);
    CALL sd_band(3, 3, 3);
    CALL sd_band(2, 2, 2);

    -- B8 · Đối kháng 7v7 (slide 8): HLV chấm 40 / 30 / 20 / 10 / 0.
    CALL sd_step(v_day1, 7, 'Đối kháng 7v7', 'B8: 7v7 tactical, HLV chấm thang thực chiến 40 / 30 / 20 / 10 / 0.',
                 t_doikhang, 'HLV');
    CALL sd_content(1, 'Điểm thực chiến', 'điểm', 1, 'BEST_OF', 'HIGHER', 'NUMBER', 0, 40);
    CALL sd_band(5, 40, NULL);
    CALL sd_band(4, 30, 39.9);
    CALL sd_band(3, 20, 29.9);
    CALL sd_band(2, 10, 19.9);

    -- B9 · Chạy 2.000 m (slide 10), thời gian tính bằng giây: 6m45s = 405 s, 7m30s = 450 s, 8m15s = 495 s, 9m00s = 540 s.
    CALL sd_step(v_day1, 8, 'Sức bền 2000m', 'B9: chạy 2.000 m. Xanh < 6m45s, Vàng 6m45s–7m29s, Cam 7m30s–8m14s, Đỏ 8m15s–9m00s.',
                 t_luc, 'MEASURED');
    CALL sd_content(1, 'Thời gian 2000m', 's', 1, 'BEST_OF', 'LOWER', 'DURATION', 300, 900);
    CALL sd_band(5, NULL, 404.9);
    CALL sd_band(4, 405, 449.9);
    CALL sd_band(3, 450, 494.9);
    CALL sd_band(2, 495, 540);

    -- B10 · Tâm lý & truyền thông (slide 11).
    CALL sd_step(v_day1, 9, 'Football IQ',
                 'B10: trả lời tình huống trong 60 giây. Xanh > 8 câu, Vàng 7–8, Xám < 3. (ngưỡng tạm) Cam 5–6, Đỏ 3–4.',
                 t_tuduy, 'HLV');
    CALL sd_content(1, 'Số câu đúng', 'câu', 1, 'BEST_OF', 'HIGHER', 'COUNT', 0, 15);
    CALL sd_band(5, 9, NULL);
    CALL sd_band(4, 7, 8);
    CALL sd_band(3, 5, 6);
    CALL sd_band(2, 3, 4);

    CALL sd_step(v_day1, 10, 'Bản lĩnh thi đấu',
                 'B10: HLV chấm mức 1–5 (5 = Xanh … 1 = Xám). (ngưỡng tạm) Slide chỉ ghi tên tiêu chí.', t_tuduy, 'HLV');
    CALL sd_content(1, 'Mức HLV chấm', 'mức', 1, 'BEST_OF', 'HIGHER', 'NUMBER', 1, 5);
    CALL sd_band(5, 5, NULL);
    CALL sd_band(4, 4, 4.9);
    CALL sd_band(3, 3, 3.9);
    CALL sd_band(2, 2, 2.9);

    CALL sd_step(v_day1, 11, 'Kỹ năng truyền thông',
                 'B10: hình ảnh và giá trị thương hiệu. HLV nhập Xuất sắc = 5, Tốt = 3, Không đạt = 1. (ngưỡng tạm)',
                 t_truyenthong, 'HLV');
    CALL sd_content(1, 'Mức HLV chấm', 'mức', 1, 'BEST_OF', 'HIGHER', 'NUMBER', 1, 5);
    CALL sd_band(5, 5, NULL);
    CALL sd_band(4, 4, 4.9);
    CALL sd_band(3, 3, 3.9);
    CALL sd_band(2, 2, 2.9);

    -- ======================= NGÀY 2 (slide 13–21) =======================
    -- Tổng = Kết quả ngày 1 (30) + GPS & AI (20) + BHL (40) + Tư duy & truyền thông (10) = 100 (slide 20).
    INSERT INTO competition_assessment_days (stage_id, day_number, title, description, display_order)
    VALUES (v_stage, 2, 'Thi đấu 11v11',
            'Chỉ 110 người tốt nhất ngày 1. Xếp loại: 90+ Elite, 80 Professional, 70 Development, 60 Academy, dưới 60 Not Selected.', 2);
    SET v_day2 = LAST_INSERT_ID();

    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order, source, source_day_id)
    VALUES (v_day2, 'KET_QUA_NGAY_1', 'Kết quả ngày 1', 30, 1, 2, 'PREV_DAY', v_day1);
    SET t_ngay1 = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day2, 'GPS_AI', 'GPS & AI', 20, 2, NULL);
    SET t_gps = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day2, 'BHL', 'Ban huấn luyện', 40, 3, NULL);
    SET t_bhl = LAST_INSERT_ID();
    INSERT INTO competition_score_topics (assessment_day_id, topic_key, name, max_points, display_order, tie_break_order)
    VALUES (v_day2, 'TU_DUY_TRUYEN_THONG', 'Tư duy & truyền thông', 10, 4, 1);
    SET t_tuduy2 = LAST_INSERT_ID();

    -- B3 · Thi đấu 11v11, phần 1 sơ khảo: GPS telemetry và AI (Xanh 20, Vàng 15, Cam 10, Đỏ 5, Xám 1).
    CALL sd_step(v_day2, 1, 'Thi đấu 11v11 · GPS & AI',
                 'B3 phần 1 sơ khảo: điểm từ GPS và AI phân tích. Xanh 20, Vàng 15, Cam 10, Đỏ 5, Xám 1.', t_gps, 'MEASURED');
    CALL sd_content(1, 'Điểm GPS & AI', 'điểm', 1, 'BEST_OF', 'HIGHER', 'NUMBER', 0, 20);
    CALL sd_band(5, 20, NULL);
    CALL sd_band(4, 15, 19.9);
    CALL sd_band(3, 10, 14.9);
    CALL sd_band(2, 5, 9.9);

    -- B3 · phần 2 chung khảo: ban huấn luyện chấm 40 / 30 / 20 / 10 / 2.
    CALL sd_step(v_day2, 2, 'Thi đấu 11v11 · Ban huấn luyện',
                 'B3 phần 2 chung khảo: đánh giá kép của ban huấn luyện, 40 / 30 / 20 / 10 / 2.', t_bhl, 'HLV');
    CALL sd_content(1, 'Điểm BHL', 'điểm', 1, 'BEST_OF', 'HIGHER', 'NUMBER', 0, 40);
    CALL sd_band(5, 40, NULL);
    CALL sd_band(4, 30, 39.9);
    CALL sd_band(3, 20, 29.9);
    CALL sd_band(2, 10, 19.9);

    -- B5 · Elite personality, tư duy & truyền thông: 10 / 8 / 6 / 4 / 2.
    CALL sd_step(v_day2, 3, 'Elite personality',
                 'B5: tư duy và truyền thông, HLV chấm 10 / 8 / 6 / 4 / 2.', t_tuduy2, 'HLV');
    CALL sd_content(1, 'Điểm tư duy & truyền thông', 'điểm', 1, 'BEST_OF', 'HIGHER', 'NUMBER', 0, 10);
    CALL sd_band(5, 10, NULL);
    CALL sd_band(4, 8, 9.9);
    CALL sd_band(3, 6, 7.9);
    CALL sd_band(2, 4, 5.9);

    COMMIT;

    SELECT d.day_number AS ngay, t.name AS nhom, t.max_points AS ti_trong,
           COALESCE(GROUP_CONCAT(CONCAT(s.title, IF(s.score_source = 'HLV', ' (HLV)', '')) ORDER BY s.step_number SEPARATOR ', '),
                    IF(t.source = 'PREV_DAY', 'lấy từ ngày trước', '')) AS bai_thi
    FROM competition_score_topics t
    JOIN competition_assessment_days d ON d.id = t.assessment_day_id
    LEFT JOIN competition_assessment_steps s ON s.topic_id = t.id
    WHERE d.stage_id = v_stage
    GROUP BY d.day_number, t.id, t.name, t.max_points, t.source, t.display_order
    ORDER BY d.day_number, t.display_order;
END //

DELIMITER ;
