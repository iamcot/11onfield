# GĐ2 · Trang player và quyền xem

Mục tiêu: kết quả Combine hiện trên trang player theo quyền do admin đặt, cầu thủ thu hẹp thêm được, kết quả chỉ ra công
khai sau ngày phát hành của vòng (tránh lộ trước khi lên sóng). Chỉ số player tự cập nhật mỗi khi kết quả chính thức đổi.

Điều kiện xong: kiểm tra bằng 3 tài khoản (khách, chính chủ, BGK) trên cùng một hồ sơ, JSON trả về cho khách không chứa
trường bị ẩn.

## Luật quyền xem

Ba mức cho mỗi nhóm dữ liệu: `HIDDEN` (chỉ BTC), `PRIVATE` (chính chủ + BTC), `PUBLIC`. Admin đặt mức tối đa; cầu thủ chỉ
hạ xuống, không nâng lên. Nhóm chưa tới ngày phát hành của vòng thì coi như `PRIVATE`.

| Nhóm (`data_group`) | Mặc định | Cầu thủ tự ẩn? |
| --- | --- | --- |
| `IDENTITY` tên, ảnh, vị trí, vùng, SBD | PUBLIC | Không |
| `BODY_BASIC` chiều cao, cân nặng | PUBLIC | Có |
| `BODY_COMPOSITION` InBody | PRIVATE | — |
| `MEDICAL` | HIDDEN, khoá | — |
| `TEST_RESULTS` số đo gốc + màu từng bài | PRIVATE | Có |
| `COMBINE_HEX` hexagon 6 trục | PUBLIC sau phát hành | Không |
| `SCORE_RANK` điểm tổng, xếp loại, hạng | PUBLIC sau phát hành | Không |
| `JUDGE_NOTES` ghi nhận BGK | HIDDEN | — |
| `MATCH_STATS` thống kê trận, heatmap | PRIVATE | Có |
| `GREEN_CARD` | PUBLIC | Không |
| `DISCIPLINE` | HIDDEN | — |

## Việc chi tiết

### 2.1 Chính sách hiển thị (migration V32)

```sql
CREATE TABLE visibility_policies (id, competition_id, stage_id NULL, data_group VARCHAR(30), max_level VARCHAR(10),
                                  owner_can_hide BOOLEAN, UNIQUE(competition_id, stage_id, data_group));
ALTER TABLE competition_stages ADD COLUMN results_release_at DATETIME NULL;   -- NULL = chưa phát hành
```

UI admin: trang `/quan-tri/giai-dau/[id]/hien-thi` là lưới nhóm dữ liệu × mức, cột vòng; nút "Phát hành kết quả vòng"
(đặt `results_release_at = now()`, hoặc hẹn giờ theo lịch phát sóng).

### 2.2 Lựa chọn của cầu thủ

```sql
CREATE TABLE player_visibility (id, user_id, data_group, level VARCHAR(10), UNIQUE(user_id, data_group));
```

`PUT /api/users/me/visibility` `{dataGroup, level}`; chặn nếu `owner_can_hide = false` hoặc level cao hơn mức tối đa.

### 2.3 Lọc ở backend

- `VisibilityService.resolve(viewer, profileOwner, competition)` trả về tập nhóm được xem.
- `UserController.getProfile` (đã lọc highlight ẩn theo cách tương tự) chỉ đưa vào DTO các nhóm được xem; trường khác để `null`
  và không serialize.
- Áp cùng luật cho `PlayerDrawer` (trang giải), leaderboard, ảnh chia sẻ / OG (PR #14).

### 2.4 Chỉ số player từ Combine

| Trục | Nguồn | Có từ |
| --- | --- | --- |
| pac Tốc độ | Sprint 30 m (+ tốc độ tối đa trong trận khi có) | Ngày 1 |
| phy Sức mạnh | Bật cao, bật xa, 2.000 m | Ngày 1 |
| sho Sút | Shot (tốc độ + trúng đích) | Ngày 1 |
| dri Rê bóng | Agility (+ bài kiểm soát khi được chốt) | Ngày 1 |
| pas Chuyền | Tỷ lệ chuyền, key pass | GPS/video |
| def Phòng thủ | Tranh chấp thắng, thu hồi, pressing | GPS/video |

- Đổi mức ra 0–99: mặc định Xám 30–49, Đỏ 50–59, Cam 60–69, Vàng 70–79, Xanh 80–99; trong dải nội suy tuyến tính theo vị
  trí số đo giữa hai ngưỡng của mức (Xanh thì kéo tới `plausible` tốt nhất = 99). Bảng dải là cấu hình (`Chờ chốt`).
- Trục nhiều bài = trung bình. Trục không có dữ liệu = không vẽ (radar hiện "chưa có").
- `PlayerStatsService.recompute(participantId)` gọi sau mỗi lần `measurement_official` đổi (event `OfficialResultChanged`, chạy
  async). Ghi `player_attributes` (khoá pac…phy đã có) với cột mới `source = 'COMBINE'`, `source_stage_id`; giữ dòng theo từng
  vòng, trang player lấy vòng mới nhất. Chỉ số admin nhập tay vẫn giữ (`source = 'MANUAL'`), nhưng khi có COMBINE thì ưu tiên COMBINE.
- Lưu thêm `player_combine_summary` (participant, 6 nhóm, Ngày 1, xếp loại, số đo gốc) để trang player đọc một lần.

### 2.5 Giao diện trang player

- Stage hexagon: chuyển sang Combine khi có; nhãn nguồn "Scouting Combine · Vòng khu vực HCM".
- Thẻ "Scouting Combine": mỗi bài một hàng (tên, số đo, chip màu, so với trung bình cùng vị trí), 6 nhóm điểm dạng thanh.
- Chính chủ thấy thêm phần `PRIVATE` có nhãn "Chỉ bạn thấy" và công tắc ẩn/hiện tại chỗ.

### 2.6–2.7

- Bật tab "Bảng xếp hạng" ở trang giải, chỉ vòng đã phát hành, theo luật `SCORE_RANK`.
- Ảnh chia sẻ / OG chỉ đọc trường `PUBLIC`.
