# 02. Hệ thống tuyển trạch vòng 1 (Scouting Combine)

Bắt đầu 2026-10-31. Phân tích và kế hoạch tổng (đã duyệt): https://claude.ai/artifact/8YNCs6rncZmCDXZvuQYLoG
Nguồn quy trình: 21 ảnh trong thư mục dự án `quy-trinh-tuyen-trach/`.

## Mục tiêu

Tổ chức được vòng tuyển trạch ở 3 khu vực: thu thập số đo của từng thí sinh, đối soát, tính điểm theo thang 5 màu và
trọng số nhóm, xếp hạng chung 3 vùng, rồi để BGK chọn tay Top 30. Kết quả đổ về trang player theo quyền xem do admin bật tắt.

## Quyết định đã chốt

- **Hệ thống chỉ thu thập và xếp hạng; mọi bước chọn người là chọn tay.** Không có ngưỡng cắt tự động.
- Sau khi cả 3 khu vực xong: Trưởng ban chọn tay 30 người dựa trên bảng xếp hạng chung + phiếu cá nhân của từng thành viên BGK.
- Cấu trúc giữ như code hiện tại: Vòng → Ngày → **Bước = bài thi** → **Assessment = nội dung thi** (ví dụ bài Shot có 2 nội dung: tốc độ, trúng đích), mỗi nội dung đo n lượt.
- Mỗi bài thi có thang 5 mức Xám → Xanh = 1 → 5 điểm. Mỗi mức đặt ngưỡng cho **tất cả** nội dung của bài; thí sinh nhận mức cao nhất mà mọi nội dung đều đạt.
- Điểm nhóm = tổng điểm 1–5 các bài trong nhóm, quy theo điểm tối đa của nhóm. Ngày 1 (100 điểm):

  | Nhóm | Điểm | Bài thi |
  | --- | --- | --- |
  | Thể hình | 10 | Cơ/mỡ, BMI |
  | Thể lực | 10 | Sprint 30 m, 2.000 m, bật cao, bật xa |
  | Kỹ thuật | 20 | Kiểm soát, dứt điểm (shot), agility |
  | Đối kháng | 20 | 7v7 tactical |
  | Tâm lý | 20 | Bản lĩnh, Football IQ |
  | Hình ảnh | 20 | Giá trị thương hiệu (truyền thông) |

- Điểm vòng tuyển trạch = 0,3 × Ngày 1 + GPS & AI (20) + BHL (40) + Tư duy & truyền thông (10). Công thức 60/20/10/5/5 dành cho các vòng trong (30 người), bàn sau.
- BGK không chấm số: chỉ tick, ghi mức tham gia (đủ / một phần / không) và ghi chú tay. Phần BHL 40 và 7v7 do vòng đánh giá tay cuối cùng nhập, có lưu vết; trước đó bảng xếp hạng ghi "chưa đủ".
- SBD tạo sẵn khi đăng ký, hiện trên app sau check-in, có trang in tại quầy; FS-ID trong ảnh = SBD.
- Trang player và mọi trang ngoài admin không hiện thứ hạng theo điểm (kết quả chọn tay sẽ khác thứ tự điểm). Chỉ hiện điểm, xếp loại, được chọn hay không.
- Ngày vòng: có ngày thì đếm ngược, chưa có thì "đang cập nhật" (đã có trong code).
- Đo đạc theo thứ tự: thiết bị câu lạc bộ hỗ trợ → thiết bị tự phát triển → nhập tay là dự phòng cuối. Cả ba đổ vào cùng một cổng nhận dữ liệu.
- Mọi con số là bản ghi thô chỉ thêm (có nguồn, người ghi, giờ đo); sửa = thêm bản ghi mới thay thế, có lý do.

## Còn chờ

- [ ] "Kiểm soát" (nhóm Kỹ thuật) đo bằng bài nào.
- [ ] Ngưỡng cơ/mỡ, BMI cho Thể hình.
- [ ] Sửa thang bị hở/chồng: sprint (Đỏ 4,71–5,00), bật cao (60–61 cm), Football IQ (3–6 câu, 8 câu), agility (ngưỡng số cho Vàng → Xám).
- [ ] Danh sách thiết bị câu lạc bộ (hãng, model) để xếp bậc tích hợp.
- [ ] Bảng đổi mức 1–5 ra thang 0–99 của hexagon (đề xuất mặc định ở `02-trang-player.md`).

## Kế hoạch theo giai đoạn

| File | Giai đoạn | Phụ thuộc |
| --- | --- | --- |
| [01-du-lieu-va-tinh-diem.md](01-du-lieu-va-tinh-diem.md) | GĐ1 · Chạy vòng 1 bằng nhập tay (gồm cổng nhận dữ liệu) | — |
| [02-trang-player.md](02-trang-player.md) | GĐ2 · Trang player và quyền xem | GĐ1 (kết quả chính thức) |
| [03-thiet-bi-do.md](03-thiet-bi-do.md) | GĐ3 · Thiết bị đo | GĐ1 (cổng nhận dữ liệu) |
| [04-phan-tich-video.md](04-phan-tich-video.md) | GĐ4 · Phân tích video | GĐ1 (cổng nhận dữ liệu) |

GĐ2, GĐ3, GĐ4 làm song song sau GĐ1. Mỗi việc dưới đây là một PR nhỏ hoặc gộp vài việc cùng vùng code.

## Bảng tiến độ

Trạng thái: `Chưa làm` · `Đang làm` · `Review` · `Xong` · `Chờ chốt` (đợi quyết định ở mục "Còn chờ").

| ID | Việc | GĐ | Trạng thái | PR |
| --- | --- | --- | --- | --- |
| 1.1 | Migration cấu hình: chiều tốt, ngưỡng hợp lý, sai số, đối tượng (cầu thủ/thủ môn) cho nội dung; nhóm điểm; điều kiện thang theo nội dung | 1 | Chưa làm | |
| 1.2 | Admin: màn cấu hình bài thi, nội dung, thang 5 mức nhiều điều kiện, kiểm tra hở/chồng | 1 | Chưa làm | |
| 1.3 | Nhóm điểm và công thức có phiên bản, khoá khi vòng bắt đầu | 1 | Chưa làm | |
| 1.4 | Mẫu "Scouting Combine vòng 1" (15 bước, ngưỡng theo ảnh) + chép sang 3 khu vực | 1 | Chờ chốt | |
| 1.5 | Bản ghi thô `measurement_raw` + chuyển dữ liệu cũ, lịch sử sửa | 1 | Chưa làm | |
| 1.6 | Cổng nhận dữ liệu chung `POST /api/ingest/measurements` (token thiết bị, chống trùng) | 1 | Chưa làm | |
| 1.7 | Tablet chấm điểm: hiện màu khi nhập, cảnh báo vô lý, ghi lỗi kỹ thuật, hàng đợi offline | 1 | Chưa làm | |
| 1.8 | Đối soát: kết quả chính thức, hàng "cần xem", sát ngưỡng, thiếu lượt, khoá/mở khoá sổ | 1 | Chưa làm | |
| 1.9 | Tính điểm mới (lượt → mức → nhóm → ngày → vòng) + test với bộ số mẫu | 1 | Chưa làm | |
| 1.10 | Ghi nhận BGK: tick, mức tham gia, ghi chú | 1 | Review | PR sắp mở |
| 1.11 | Cờ thí sinh: y tế, kỷ luật, Low Performance, không thi; vai trò Y tế, Điều phối | 1 | Review | PR sắp mở |
| 1.12 | Green Card: 4 thẻ, mỗi thẻ 1 lần/mùa | 1 | Review | PR sắp mở |
| 1.13 | Nhập điểm đánh giá tay (BHL 40, 7v7) có lý do | 1 | Review | PR sắp mở |
| 1.14 | Bảng xếp hạng chung 3 vùng, thủ môn riêng, đồng điểm, "chưa đủ" | 1 | Chưa làm | |
| 1.15 | Chọn Top 30: phiếu BGK + quyết định chọn có lưu vết (nâng cấp trang `tuyen-chon`) | 1 | Chưa làm | |
| 1.16 | QR trên phiếu SBD in tại quầy | 1 | Chưa làm | |
| 1.17 | Xuất biên bản (Excel/PDF) theo ngày | 1 | Chưa làm | |
| 1.18 | Chạy thử 1.000 thí sinh giả (script seed + kịch bản) | 1 | Chưa làm | |
| 2.1 | Chính sách hiển thị theo nhóm dữ liệu + ngày phát hành theo vòng | 2 | Chưa làm | |
| 2.2 | Cầu thủ thu hẹp quyền xem (`player_visibility`) | 2 | Chưa làm | |
| 2.3 | Lọc ở backend trong `GET /api/users/{userid}` | 2 | Chưa làm | |
| 2.4 | Tính chỉ số player từ Combine (hexagon 0–99, nhóm điểm, số đo gốc), tự cập nhật | 2 | Chờ chốt | |
| 2.5 | Thẻ Combine trên trang player + công tắc ẩn/hiện của chính chủ | 2 | Chưa làm | |
| 2.6 | Tab Bảng xếp hạng ở trang giải: chỉ hiện Top 30 sau khi chốt chọn, không số hạng | 2 | Chưa làm | |
| 2.7 | Ảnh chia sẻ / link preview chỉ dùng trường công khai | 2 | Chưa làm | |
| 3.1 | Đăng ký thiết bị, token, phiếu hiệu chuẩn | 3 | Chưa làm | |
| 3.2 | Nhập file từ thiết bị (CSV, FIT, Excel) theo mẫu ánh xạ | 3 | Chờ chốt | |
| 3.3 | Thu nhịp tim Garmin / ANT+ cho nhóm 15 người | 3 | Chưa làm | |
| 3.4 | Cổng sprint ESP32 + đồng bộ giờ | 3 | Chưa làm | |
| 3.5 | Chip RFID UHF: nhận dạng + đếm vòng 2.000 m | 3 | Chưa làm | |
| 3.6 | Thảm bật (thời gian bay) | 3 | Chưa làm | |
| 3.7 | Radar tốc độ sút | 3 | Chưa làm | |
| 3.8 | Đọc số từ ảnh màn hình thiết bị | 3 | Chưa làm | |
| 4.1 | Khung ứng dụng phân tích video (Python, chạy localhost) | 4 | Chưa làm | |
| 4.2 | Hiệu chuẩn sân bằng 4+ điểm, lưu theo sân/camera | 4 | Chưa làm | |
| 4.3 | Phát hiện + bám vết + chia đội | 4 | Chưa làm | |
| 4.4 | Gắn SBD tay, đánh dấu đoạn nghi đổi mã | 4 | Chưa làm | |
| 4.5 | Chỉ số thể lực, heatmap, xuất JSON + video có khung | 4 | Chưa làm | |
| 4.6 | Gửi lên máy chủ + màn xem cho BGK trong admin | 4 | Chưa làm | |
| 4.7 | So sánh với GPS trên trận 7v7 thật | 4 | Chưa làm | |

## Mockup

Mockup các màn chính (canvas thiết kế): https://claude.ai/artifact/5bx2pLpZeUDWpBP8hRuguy

| Màn | Việc liên quan |
| --- | --- |
| Admin: cấu hình thang bài thi (nhiều nội dung, cảnh báo hở/chồng, thử nhanh) | 1.1, 1.2, 1.3 |
| Tablet chấm điểm: hiện màu khi nhập, cảnh báo vô lý, lỗi kỹ thuật, hàng chờ offline | 1.7 |
| Tablet BGK: tick, mức tham gia, ghi chú | 1.10 |
| Admin: đối soát, chọn bản ghi gốc có lý do, khoá sổ trạm | 1.8 |
| Admin: xếp hạng chung 3 vùng, phiếu BGK, chọn Top 30 | 1.14, 1.15 |
| Admin: quyền hiển thị theo nhóm dữ liệu, phát hành theo vùng | 2.1 |
| Trang player: thẻ Combine, hexagon, công tắc "Chỉ bạn thấy" | 2.4, 2.5 |

Số liệu và ngưỡng trên mockup là minh hoạ.
