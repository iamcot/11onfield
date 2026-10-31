# 06 · Nhập điểm đơn giản hoá

> Trạng thái: **chưa làm**, đã chốt hướng với chủ dự án ngày 31/10/2026. Nhánh: `claude/project-thread-nlr5ou` (PR #15).

## Mô hình điểm (đã chốt)

```
Vòng → Ngày thi → Nhóm điểm (tỉ trọng, tổng 100) → Bài thi (xám→xanh = mức 1–5) → Nội dung thi (số gốc)
```

- **Ngày:** tổng kết của ngày bằng tổng điểm các nhóm, mỗi nhóm theo tỉ trọng (điểm tối đa) của nó.
- **Nhóm điểm:** điểm nhóm bằng **trung bình mức 1–5 của các bài trong nhóm**, quy theo tỉ trọng nhóm.
  - Phần này `ScoringEngine.topicPoints` **đã tính đúng** (tổng mức / (5 × số bài) × tỉ trọng, tức là trung bình). Chỉ cần sửa chữ trên giao diện thành "trung bình".
- **Bài thi:** có thang 5 mức. Mức của bài lấy từ các nội dung thi theo thang (đã có).
- **Nội dung thi:** là chỗ thu thập số gốc. Số có thể đến từ máy đo, import file, hoặc nhập tay. **Điểm HLV cũng nhập ở đây**, không có mục riêng.

## Việc cần làm (theo thứ tự)

### 1. Nguồn điểm ở cấp bài thi, gỡ "HLV chấm tay" và mục Điểm chấm tay

Mỗi bài thi có thêm ô **Nguồn điểm**:
- **Số liệu đo** (`MEASURED`, mặc định): TTV nhập, máy đo, hoặc import file.
- **Điểm HLV** (`HLV`): chỉ HLV (và admin sửa) nhập, trên cùng màn Chấm điểm tại trạm.
  - HLV nhập ngay trong lúc thi, hoặc cuối giờ từ sổ tay, sau này có thể qua OCR.
  - Bài loại này sau này hiện thêm link tham khảo (video, AI, GPS). Phần link **chưa làm**.

Backend:
- Migration `V36`:
  - `ALTER TABLE competition_assessment_steps ADD COLUMN score_source VARCHAR(10) NOT NULL DEFAULT 'MEASURED';`
  - Bỏ cột `competition_score_topics.scored_by` (thêm ở V35, hôm nay) và thay bằng `source VARCHAR(10) NULL` (`NULL` = từ bài thi, `PREV_DAY`) cộng `source_day_id BIGINT NULL`. Xem mục 4.
- `CompetitionAssessmentStep.scoreSource`.
  - `AdminCombineController` combine-config GET/PUT trả về và nhận `scoreSource`.
  - `CompetitionAssessmentStructureService`, phần sao chép cấu trúc, copy cả field này.
- `AdminCompetitionApiController.fieldScoringSave`: bài `HLV` mà người gọi không có `ROLE_HLV` hoặc `ROLE_ADMIN` thì trả 403 "Bài này là Điểm HLV, chỉ HLV nhập".
  - field-scoring context (danh sách bài) và `scouting/context` trả thêm `scoreSource` cho từng bài.
- Gỡ phần "nhóm HLV chấm tay" làm hôm nay:
  - `RoundScoringService.day()`: đoạn `TOPIC_<id>`.
  - `AdminScoutingApiController.handTopics` và các endpoint `stages/{id}/manual-scores*`.
  - `AdminFlowController`: luật `diem-cham-tay`.
  - Bảng `manual_scores` để lại, không dùng nữa.

Frontend:
- `round-setup.tsx` StepEditor (thẻ cài đặt): thêm select **Nguồn điểm**.
- `TopicsEditor`: bỏ cột "Cách chấm" (HLV chấm tay) và đổi chữ "tổng mức" thành "trung bình mức".
- Gỡ bước Điểm chấm tay:
  - mục `diem-cham-tay` trong `lib/admin/competition-flow.ts`;
  - các trang `giai-dau/[id]/vong/[n]/diem-cham-tay` và `quan-tri/diem-cham-tay`;
  - mục menu trong `lib/admin/nav.ts`;
  - `components/admin/ManualScores.tsx`.
- Màn Chấm điểm (`components/admin/day/FieldScoring.tsx`): bài `HLV` có nhãn "Điểm HLV". TTV không thấy, hoặc thấy nhưng không sửa được.

### 2. Chế độ bảng để nhập bù cuối giờ

Trong màn Chấm điểm thêm chế độ **Bảng**:
- Chọn một bài: mỗi hàng là một thí sinh (SBD, tên), mỗi cột là một lượt của một nội dung.
- Gõ liền một mạch, Tab/Enter sang ô kế, lưu theo hàng. Dùng lại `field-scoring/save` với `clientUuid` mỗi hàng.
- Sau này OCR đổ số vào đúng bảng này để người kiểm rồi lưu.

### 3. Số người đi tiếp sang ngày sau

- Mỗi ngày thi có cấu hình **"Số người đi tiếp"** `{x}` (ví dụ 110 sau ngày 1).
  - Cột mới `competition_assessment_days.advance_count INT NULL`.
- Bảng mới `day_participants (id, day_id, participant_id, reason ENUM('TOP','EXCEPTION'), note, added_by, added_at, UNIQUE(day_id, participant_id))`.
- Ở bảng xếp hạng của ngày (Kết quả vòng, lọc theo ngày) có nút **"Chuyển top {x} sang ngày {n+1}"**. Nút ghi `TOP` cho x người đầu theo tổng kết ngày.
- HLV hoặc admin **thêm ngoại lệ** (`EXCEPTION`, bắt buộc ghi lý do) và gỡ được người đã thêm.
- Ngày có danh sách thì check-in, chấm điểm, ghi nhận và kết quả của ngày đó chỉ hiện những người trong danh sách. Ngày 1 (không có danh sách) hiện mọi người như hiện tại.
- Thanh điều hướng: ✓ ở "Kết quả vòng" khi đã chuyển. Có thể thêm meta "110 đi tiếp".

### 4. Nhóm điểm loại "Điểm từ ngày trước"

- Nhóm điểm có thêm loại **"Điểm từ ngày trước"**: `source = 'PREV_DAY'`, `source_day_id` là ngày được chọn, thường là ngày 1.
- Nhóm này **không có bài thi và không cần nhập**. Điểm nhóm = tổng kết (0–100) của ngày được chọn × tỉ trọng nhóm / 100. Ví dụ tỉ trọng 30 thì ngày 1 được 80 điểm cho ra 24.
- `ScoringService.scoreDay`: với nhóm `PREV_DAY`, tính tổng ngày nguồn cho từng thí sinh (gọi lại `scoreDay(sourceDayId, …)`) rồi quy đổi. Thí sinh chưa có tổng ngày nguồn thì nhóm là `null` (ngày chưa đủ).
- `TopicsEditor`: cột "Loại" gồm "Từ bài thi" và "Điểm từ ngày trước". Khi chọn loại thứ hai thì hiện select ngày nguồn (các ngày trước của cùng vòng).
- Cây ngày và bài (`vong/[n]/page.tsx`): nhóm `PREV_DAY` hiện "lấy từ Ngày 1" thay cho danh sách bài.

## Ghi chú

- Công thức vòng mặc định đã đổi hôm nay (`RoundFormula.daysAverage`): điểm vòng là trung bình các ngày. Nếu ngày 2 đã kéo 30% từ ngày 1 thì nên xem lại có cần tính vòng = ngày cuối hay không. **Cần hỏi lại chủ dự án.**
- Đã có sẵn và không đổi:
  - thanh điều hướng 3 bước (`05-dieu-huong-giai.md`);
  - mã nhóm tự sinh;
  - ưu tiên đồng điểm theo số thứ tự của nhóm;
  - sửa lỗi `client_uuid` quá dài.
