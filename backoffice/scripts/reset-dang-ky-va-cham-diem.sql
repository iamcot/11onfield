-- ============================================================================
-- Dọn để chấm thử lại từ đầu: gỡ đăng ký thí sinh và xoá dữ liệu chấm điểm của vòng.
-- Cấu trúc bài thi (ngày, nhóm điểm, bài, nội dung, thang 5 mức) và công thức điểm vòng được GIỮ NGUYÊN.
--
-- Nạp script một lần:
--   mysql -u<user> -p <db> --default-character-set=utf8mb4 < backoffice/scripts/reset-dang-ky-va-cham-diem.sql
--
-- Rồi gọi các lệnh (đổi id giải và số vòng):
--   CALL xem_dang_ky(1);              -- xem danh sách đăng ký, cột hop_le = 1 là người có SBD (giống trang public)
--   CALL reset_cham_diem(1, 2);       -- xoá dữ liệu chấm điểm của vòng 2: số đo, check-in, ghi nhận, cờ y tế,
--                                     -- khoá sổ, danh sách đi tiếp, điểm vòng, kết quả vòng
--   CALL go_dang_ky(1, 1);            -- gỡ các đăng ký KHÔNG hợp lệ (chưa duyệt hồ sơ, tài khoản khoá, đã rút lui)
--   CALL go_dang_ky(1, 0);            -- gỡ TOÀN BỘ đăng ký của giải (kèm mọi số đo, phiếu bầu, thẻ xanh của họ)
--
-- KHÔNG HOÀN TÁC ĐƯỢC. Nên dump DB trước:  mysqldump -u<user> -p <db> > backup.sql
-- ============================================================================

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS xem_dang_ky;
DROP PROCEDURE IF EXISTS reset_cham_diem;
DROP PROCEDURE IF EXISTS go_dang_ky;

DELIMITER //

-- Đăng ký của giải, theo thứ tự đăng ký. hop_le theo đúng luật của danh sách thí sinh / trang public:
-- tài khoản PLAYER đang bật, hồ sơ cầu thủ đã duyệt, chưa rút lui.
CREATE PROCEDURE xem_dang_ky(IN p_competition BIGINT)
BEGIN
    SELECT p.id AS participant_id, u.id AS user_id, u.full_name, u.phone, p.status, p.registration_date,
           (u.role = 'PLAYER' AND u.enabled = 1 AND COALESCE(pl.verified, 0) = 1 AND p.status <> 'WITHDRAWN') AS hop_le,
           (SELECT COUNT(*) FROM measurement_raw r WHERE r.participant_id = p.id) AS so_do
    FROM competition_participants p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN players pl ON pl.id = u.id
    WHERE p.competition_id = p_competition
    ORDER BY p.registration_date, p.id;
END //

CREATE PROCEDURE reset_cham_diem(IN p_competition BIGINT, IN p_stage_number INT)
BEGIN
    DECLARE v_stage BIGINT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    SELECT id INTO v_stage FROM competition_stages WHERE competition_id = p_competition AND stage_number = p_stage_number;
    IF v_stage IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không tìm thấy vòng này của giải';
    END IF;

    START TRANSACTION;
    DROP TEMPORARY TABLE IF EXISTS tmp_reset_assessments;
    CREATE TEMPORARY TABLE tmp_reset_assessments AS
        SELECT a.id FROM competition_assessments a
        JOIN competition_assessment_steps st ON st.id = a.assessment_step_id
        JOIN competition_assessment_days d ON d.id = st.assessment_day_id
        WHERE d.stage_id = v_stage;

    -- Số đo: số chính thức trước, rồi bỏ liên kết bản sửa → bản gốc, rồi các bản ghi.
    DELETE FROM measurement_official WHERE assessment_id IN (SELECT id FROM tmp_reset_assessments);
    UPDATE measurement_raw SET supersedes_id = NULL WHERE assessment_id IN (SELECT id FROM tmp_reset_assessments);
    DELETE FROM measurement_raw WHERE assessment_id IN (SELECT id FROM tmp_reset_assessments);
    DELETE FROM competition_assessment_results WHERE assessment_id IN (SELECT id FROM tmp_reset_assessments);
    DELETE s FROM competition_assessment_step_scores s
        JOIN competition_assessment_steps st ON st.id = s.assessment_step_id
        JOIN competition_assessment_days d ON d.id = st.assessment_day_id WHERE d.stage_id = v_stage;

    -- Ghi nhận của HLV, khoá sổ, danh sách đi tiếp.
    DELETE n FROM judge_notes n
        JOIN competition_assessment_steps st ON st.id = n.step_id
        JOIN competition_assessment_days d ON d.id = st.assessment_day_id WHERE d.stage_id = v_stage;
    DELETE l FROM assessment_locks l
        JOIN competition_assessment_steps st ON st.id = l.step_id
        JOIN competition_assessment_days d ON d.id = st.assessment_day_id WHERE d.stage_id = v_stage;
    DELETE dp FROM day_participants dp
        JOIN competition_assessment_days d ON d.id = dp.day_id WHERE d.stage_id = v_stage;
    UPDATE competition_assessment_days SET advance_count = NULL WHERE stage_id = v_stage;

    -- Check-in, cờ y tế của vòng, điểm vòng, kết quả vòng.
    DELETE FROM stage_checkins WHERE stage_id = v_stage;
    DELETE FROM participant_flags WHERE stage_id = v_stage;
    DELETE FROM manual_scores WHERE stage_id = v_stage;
    DELETE FROM score_snapshots WHERE stage_id = v_stage;
    DELETE FROM stage_results WHERE stage_id = v_stage;

    DROP TEMPORARY TABLE IF EXISTS tmp_reset_assessments;
    COMMIT;
    SELECT CONCAT('Đã xoá dữ liệu chấm điểm của vòng ', p_stage_number, '. Cấu trúc bài thi vẫn giữ.') AS ket_qua;
END //

-- p_chi_khong_hop_le = 1: chỉ gỡ đăng ký không hợp lệ; 0: gỡ tất cả đăng ký của giải.
CREATE PROCEDURE go_dang_ky(IN p_competition BIGINT, IN p_chi_khong_hop_le TINYINT)
BEGIN
    DECLARE v_count INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;
    DROP TEMPORARY TABLE IF EXISTS tmp_go;
    CREATE TEMPORARY TABLE tmp_go AS
        SELECT p.id FROM competition_participants p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN players pl ON pl.id = u.id
        WHERE p.competition_id = p_competition
          AND (p_chi_khong_hop_le = 0
               OR NOT (u.role = 'PLAYER' AND u.enabled = 1 AND COALESCE(pl.verified, 0) = 1 AND p.status <> 'WITHDRAWN'));
    SELECT COUNT(*) INTO v_count FROM tmp_go;

    -- Những liên kết không tự xoá theo: số chính thức → bản ghi, bản sửa → bản gốc, thẻ xanh.
    DELETE FROM measurement_official WHERE participant_id IN (SELECT id FROM tmp_go);
    UPDATE measurement_raw SET supersedes_id = NULL WHERE participant_id IN (SELECT id FROM tmp_go);
    DELETE FROM measurement_raw WHERE participant_id IN (SELECT id FROM tmp_go);
    UPDATE green_cards SET participant_id = NULL WHERE participant_id IN (SELECT id FROM tmp_go);
    -- Còn lại (check-in, ghi nhận, cờ, điểm vòng, kết quả, phiếu bầu, danh sách đi tiếp) xoá theo khoá ngoại.
    DELETE FROM competition_participants WHERE id IN (SELECT id FROM tmp_go);

    DROP TEMPORARY TABLE IF EXISTS tmp_go;
    COMMIT;
    SELECT CONCAT('Đã gỡ ', v_count, ' đăng ký') AS ket_qua;
END //

DELIMITER ;
