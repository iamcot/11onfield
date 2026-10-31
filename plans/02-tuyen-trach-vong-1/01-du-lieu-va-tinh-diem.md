# GĐ1 · Chạy vòng 1 bằng nhập tay

Mục tiêu: tổ chức được một ngày Combine chỉ với tablet nhập tay, có đối soát, tính điểm đúng quy tắc đã chốt, xếp hạng
chung 3 vùng và chọn tay Top 30. Gồm luôn cổng nhận dữ liệu chung để GĐ3, GĐ4 cắm vào sau.

Điều kiện xong: chạy thử 1.000 thí sinh giả qua đủ 10 bước Ngày 1 (việc 1.18), điểm khớp bảng tính tay trên 20 trường hợp mẫu.

## Hiện trạng code (main, b7df172)

- `competition_assessment_days / steps / assessments / results / step_ratings / step_scores`, `stage_results` (V17).
- `CompetitionAssessmentResultService`: điểm bước = **cộng giá trị thô các assessment**; thang 1–5 theo **tổng của bước**, chỉ
  ngưỡng `>=` hoặc khoảng; giá trị rơi vào khoảng trống thành mức 1; điểm vòng = cộng điểm bước.
- `recordAttemptResult` ghi đè bản cũ, không lưu người nhập.
- Tablet chấm điểm `/quan-tri/cham-diem` (SBD, bàn phím số, wake lock), check-in QR (V26), chọn Top 30/11 tay
  (`/quan-tri/giai-dau/[id]/tuyen-chon`), vai trò `BGK` (V24).

## Mô hình dữ liệu (migration V28–V31)

Đặt tên theo bảng có sẵn. Bước = bài thi, assessment = nội dung thi.

### V28 · Cấu hình bài thi và thang điểm

```sql
ALTER TABLE competition_assessments
  ADD COLUMN direction VARCHAR(10) NOT NULL DEFAULT 'HIGHER',      -- HIGHER | LOWER (sprint, 2.000 m)
  ADD COLUMN plausible_min DECIMAL(10,3) NULL,                     -- chặn giá trị vô lý trên tablet
  ADD COLUMN plausible_max DECIMAL(10,3) NULL,
  ADD COLUMN tolerance DECIMAL(10,3) NULL,                         -- sai số cho phép khi đối soát, ví dụ 0.02 s
  ADD COLUMN value_type VARCHAR(12) NOT NULL DEFAULT 'NUMBER';     -- NUMBER | DURATION (mm:ss) | COUNT

ALTER TABLE competition_assessment_steps
  ADD COLUMN is_scored BOOLEAN NOT NULL DEFAULT TRUE,              -- khởi động, recovery = FALSE
  ADD COLUMN audience VARCHAR(12) NOT NULL DEFAULT 'ALL',          -- ALL | OUTFIELD | GOALKEEPER
  ADD COLUMN topic_id BIGINT NULL;

CREATE TABLE competition_score_topics (            -- nhóm điểm của một ngày
  id, assessment_day_id, topic_key, name, max_points DECIMAL(6,2), display_order, tie_break_order NULL
);

-- Thang 5 mức của bài thi: một dòng mỗi mức (đã có competition_assessment_step_ratings),
-- thêm hành động đi kèm; điều kiện theo từng nội dung đặt ở bảng con.
ALTER TABLE competition_assessment_step_ratings
  ADD COLUMN color VARCHAR(10) NULL,                               -- GREY RED ORANGE YELLOW GREEN
  ADD COLUMN action VARCHAR(12) NOT NULL DEFAULT 'NONE';           -- NONE | FLAG | ELIMINATE (Xám shot = FLAG Low Performance)

CREATE TABLE competition_rating_conditions (
  id, rating_id, assessment_id, range_min DECIMAL NULL, range_max DECIMAL NULL   -- [min, max), NULL = không giới hạn
);
```

`threshold_type / threshold_value / range_*` cũ trên `step_ratings` giữ lại cho dữ liệu cũ, không dùng cho cấu hình mới.

### V29 · Bản ghi thô và kết quả chính thức

```sql
CREATE TABLE measurement_raw (
  id, client_uuid VARCHAR(36) UNIQUE,              -- chống gửi trùng
  assessment_id, participant_id, attempt_number,
  value DECIMAL(10,3) NULL, status VARCHAR(10),    -- OK | FAULT (va cọc) | DNS (không thi)
  fault_note VARCHAR(200) NULL,
  source VARCHAR(10),                              -- MANUAL | DEVICE | FILE | VIDEO
  device_id BIGINT NULL, recorded_by BIGINT NULL,  -- user nhập tay
  measured_at DATETIME(3), received_at DATETIME(3),
  evidence_url VARCHAR(500) NULL,
  supersedes_id BIGINT NULL, reason VARCHAR(300) NULL,   -- sửa = dòng mới thay dòng cũ
  INDEX (assessment_id, participant_id, attempt_number)
);

CREATE TABLE measurement_official (                -- giá trị dùng để tính điểm, một dòng mỗi lượt
  id, assessment_id, participant_id, attempt_number,
  raw_id BIGINT NULL, state VARCHAR(12),           -- AUTO | REVIEW | RESOLVED | LOCKED
  review_reason VARCHAR(30) NULL,                  -- SOURCE_MISMATCH | IMPLAUSIBLE | NEAR_BOUNDARY | MISSING
  resolved_by BIGINT NULL, resolved_at DATETIME NULL, note VARCHAR(300) NULL,
  UNIQUE (assessment_id, participant_id, attempt_number)
);

CREATE TABLE assessment_locks (id, step_id NULL, assessment_day_id NULL, locked_by, locked_at, unlocked_by NULL, unlocked_at NULL, reason NULL);
```

Chuyển `competition_assessment_results` hiện có sang `measurement_raw` (source = MANUAL) và tạo `measurement_official`
tương ứng. Bảng cũ để lại một bản phát hành rồi xoá.

### V30 · Ghi nhận BGK, cờ, Green Card, điểm tay

```sql
CREATE TABLE judge_notes (id, judge_user_id, participant_id, step_id, participation VARCHAR(8), -- FULL | PARTIAL | NONE
                          ticked BOOLEAN, note TEXT, created_at, updated_at, UNIQUE(judge_user_id, participant_id, step_id));
CREATE TABLE participant_flags (id, participant_id, stage_id, kind VARCHAR(20),  -- MEDICAL_OUT | DISCIPLINE | LOW_PERFORMANCE | DNS
                                step_id NULL, reason TEXT, created_by, created_at, revoked_by NULL, revoked_at NULL);
CREATE TABLE green_cards (id, competition_id, holder_user_id, holder_title, participant_id NULL, reason TEXT NULL, used_at NULL,
                          UNIQUE(competition_id, holder_user_id));
CREATE TABLE manual_scores (id, stage_id, participant_id, component_key VARCHAR(20),  -- BHL | TACTICAL_7V7 | MIND_MEDIA | GPS_AI
                            points DECIMAL(6,2), entered_by, entered_at, reason TEXT, supersedes_id NULL);
ALTER TABLE users MODIFY COLUMN role ENUM('USER','PLAYER','COACH','SCOUTER','EDITOR','BGK','MEDICAL','COORDINATOR','ADMIN','SUPER_USER') NOT NULL;
```

### V31 · Công thức, xếp hạng, chọn người

```sql
CREATE TABLE score_formulas (id, stage_id, version INT, definition JSON, created_by, created_at, locked_at NULL);
-- definition: {"day1Weight":0.3,"components":[{"key":"DAY1","max":30},{"key":"GPS_AI","max":20},{"key":"BHL","max":40},{"key":"MIND_MEDIA","max":10}],
--              "classes":[[90,"Elite Prospect"],[80,"Professional Potential"],[70,"Development Squad"],[60,"Academy Level"],[0,"Not Selected"]],
--              "tieBreak":["MIND","DISCIPLINE","PHYSICAL"]}
CREATE TABLE score_snapshots (id, stage_id, participant_id, formula_version, total DECIMAL(6,2) NULL, complete BOOLEAN,
                              breakdown JSON, computed_at);
CREATE TABLE selection_votes (id, competition_id, round_key VARCHAR(20), judge_user_id, participant_id, created_at,
                              UNIQUE(competition_id, round_key, judge_user_id, participant_id));
CREATE TABLE selection_decisions (id, competition_id, round_key, participant_ids JSON, decided_by, decided_at, note TEXT);
```

## Việc chi tiết

### 1.1–1.3 Cấu hình

- Backend: mở rộng `CompetitionAssessmentStructureService` + DTO; endpoint `PUT /assessment-steps/{id}/rating-scale` nhận
  `[{level, color, action, conditions:[{assessmentId, min, max}]}]`.
- Kiểm tra khi lưu: với mỗi nội dung, các khoảng của 5 mức phải nối liền, không chồng, phủ từ `plausible_min` đến `plausible_max`;
  trả lỗi chỉ rõ khoảng hở (ví dụ "60–61 cm chưa thuộc mức nào").
- Nhóm điểm: CRUD theo ngày; tổng `max_points` của ngày phải = 100 mới cho khoá.
- Công thức: tạo phiên bản mới, xem trước thứ hạng thay đổi, khoá khi vòng chuyển sang ONGOING.
- UI: trang `/quan-tri/giai-dau/[id]/vong/[n]` thêm tab "Thang điểm" (bảng mức × nội dung) và "Nhóm điểm".

### 1.4 Mẫu Combine

- File JSON `backoffice/src/main/resources/templates/combine-v1.json` chứa 15 bước, nội dung, thang theo ảnh (đã sửa hở/chồng
  khi được chốt), nhóm điểm Ngày 1.
- Nút "Tạo từ mẫu Combine" trên vòng khu vực; dùng `copy-from` có sẵn để chép sang 2 vùng còn lại.

### 1.5–1.6 Bản ghi thô và cổng nhận dữ liệu

- `MeasurementService.record(...)` là đường duy nhất ghi số đo; tablet, file, thiết bị, video đều đi qua.
- `POST /api/ingest/measurements` (token thiết bị ở header) nhận mảng bản ghi; trả từng dòng `accepted | duplicate | rejected(lý do)`.
- Endpoint tablet hiện có `field-scoring/save` gọi lại `MeasurementService` với source MANUAL và `recorded_by`.

### 1.7 Tablet chấm điểm

- Hiện màu ngay khi nhập đủ lượt (gọi API tính thử, không lưu).
- Ngoài `plausible_min/max` → hộp xác nhận đỏ; vẫn lưu được nhưng vào hàng "cần xem".
- Nút lỗi nhanh: Va cọc, Trượt chân, Không thi (DNS).
- Hàng đợi offline trong IndexedDB với `client_uuid`; đồng bộ khi có mạng, hiện số bản ghi chờ gửi.

### 1.8 Đối soát

- Khi có bản ghi mới: tính lại `measurement_official` của lượt đó theo luật: một nguồn → AUTO; nhiều nguồn lệch ≤ tolerance →
  AUTO, ưu tiên DEVICE > FILE > VIDEO > MANUAL; lệch hơn → REVIEW; ngoài khoảng hợp lý → REVIEW; trong sai số của ranh giới mức → đánh dấu NEAR_BOUNDARY (vẫn AUTO).
- Trang mới `/quan-tri/giai-dau/[id]/vong/[n]/doi-soat`: danh sách cần xem, lọc theo bài; mở một dòng thấy mọi bản ghi thô, video bằng chứng, chọn giá trị đúng + ghi chú.
- Khoá bước/ngày: không khoá được nếu còn REVIEW hoặc thiếu lượt chưa đánh DNS. Mở khoá cần SUPER_USER hoặc Trưởng ban, bắt buộc lý do.

### 1.9 Tính điểm

`ScoringService` thay phần tính trong `CompetitionAssessmentResultService`:

1. Gộp lượt theo `scoring_method` và `direction` (BEST_OF với LOWER = nhỏ nhất).
2. Mức bài = mức cao nhất mà mọi điều kiện đều thoả; không thoả mức nào = 1 (Xám). Bài có DNS = không có mức.
3. Điểm nhóm = `max_points × Σ mức / (5 × số bài có mức)`; nhóm thiếu bài → `complete = false`.
4. Ngày 1 = Σ nhóm (100). Vòng = theo `score_formulas.definition`, phần nào thiếu (BHL chưa nhập) → `complete = false`.
5. Lưu `score_snapshots` với `breakdown` đầy đủ để trang admin mở ra giải thích.

Test: `ScoringServiceTest` với bảng số mẫu (sprint 4,10 / 4,11 / 4,70 / 4,71 / 5,01; shot 112 km/h + 4/5 → Vàng; thủ môn bỏ bài
không áp dụng; DNS), và một test xác định: cùng dữ liệu + cùng phiên bản công thức → cùng kết quả.

### 1.10–1.13 BGK, cờ, Green Card, điểm tay

- Tablet BGK: chọn bài → danh sách thí sinh của lượt → mỗi người 3 nút (Đủ / Một phần / Không), nút tick, ô ghi chú.
- Bác sĩ (MEDICAL): nút "Không đủ điều kiện" trên trang thí sinh, bắt buộc lý do; thí sinh bị chặn ở tablet các trạm sau.
- Điều phối (COORDINATOR): ghi vi phạm kỷ luật; đếm số vi phạm dùng cho đồng điểm.
- Low Performance: tự tạo khi bài có `action = FLAG` ra mức đó (Xám shot); tablet bước 8 hiện cảnh báo.
- Green Card: SUPER_USER gán 4 người giữ thẻ; người giữ thẻ dùng trên trang thí sinh, xác nhận 2 lần, không thu hồi; thí sinh
  vào thẳng danh sách Top 30.
- Điểm tay: trang "Đánh giá cuối" cho Trưởng ban nhập BHL, 7v7, tư duy & truyền thông, thấy ghi nhận BGK bên cạnh.

### 1.14–1.15 Xếp hạng và chọn Top 30

- `GET /admin/api/competitions/{id}/ranking?region=&position=&gk=` từ `score_snapshots`; cột: hạng, SBD, tên, vùng, vị trí,
  6 nhóm, Ngày 1, vòng, xếp loại, cờ, số phiếu BGK, `complete`.
- Phiếu BGK: mỗi thành viên chọn tối đa N người (cấu hình, mặc định 30), không thấy phiếu người khác trước khi Trưởng ban mở.
- Trang `tuyen-chon` nâng cấp: bảng xếp hạng + cột phiếu + ghi nhận BGK; Trưởng ban chọn 30, lưu `selection_decisions`;
  chọn người hạng > 30 hoặc bỏ người hạng ≤ 30 bắt buộc ghi chú. Sau khi lưu mới đổi trạng thái thí sinh và gửi thông báo (đã có).

### 1.16–1.18 Phụ trợ

- Trang in SBD: thêm QR chứa mã thí sinh (không chứa thông tin cá nhân).
- Xuất biên bản: Excel theo ngày/bài (số thô, mức, người nhập), PDF bảng xếp hạng có chỗ ký.
- Script `backoffice/scripts/seed-combine-demo.sql` (hoặc lệnh Spring profile `demo`) tạo 1.000 thí sinh, số đo ngẫu nhiên
  theo phân phối hợp lý, vài ca lệch nguồn và vô lý để thử đối soát.

## Rủi ro

- Đổi cách tính điểm bước làm thay đổi `stage_results` cũ: chỉ áp cho vòng tạo từ cấu hình mới; vòng cũ giữ cách cũ (cờ `scoring_version` trên stage).
- Tablet offline có thể gửi trễ sau khi khoá sổ: bản ghi vẫn lưu ở `measurement_raw`, lượt chuyển REVIEW, không tự sửa số đã khoá.
