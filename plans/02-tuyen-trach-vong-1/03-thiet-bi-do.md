# GĐ3 · Thiết bị đo

Mục tiêu: giảm nhập tay. Thứ tự ưu tiên: thiết bị câu lạc bộ hỗ trợ → thiết bị tự phát triển → nhập tay. Mọi nguồn đi vào
`POST /api/ingest/measurements` (việc 1.6), khác nhau ở `source`, `device_id`, sai số khai báo.

Điều kiện xong cho mỗi thiết bị: phiếu hiệu chuẩn so với chuẩn (đồng hồ chuyên dụng hoặc video 240 fps) trên ít nhất 30 lần
đo, sai số trung bình và lớn nhất ghi vào admin.

## 3.1 Đăng ký thiết bị

```sql
CREATE TABLE devices (id, name, kind VARCHAR(20),          -- TIMING_GATE | HR | JUMP_MAT | RADAR | GPS | RFID | CLUB_<model>
                      owner VARCHAR(20),                     -- CLUB | DIY
                      token_hash, assessment_id NULL, stage_id NULL, tolerance DECIMAL NULL, active BOOLEAN, created_at);
CREATE TABLE device_calibrations (id, device_id, reference VARCHAR(100), samples INT, mean_error DECIMAL, max_error DECIMAL,
                                  file_url NULL, done_by, done_at);
```

Trang admin `/quan-tri/thiet-bi`: tạo thiết bị → hiện token một lần + QR cấu hình; gán vào trạm (vòng + nội dung thi).

## 3.2 Thiết bị câu lạc bộ: 4 bậc tích hợp

1. API/SDK → viết adapter nhỏ (chạy trên laptop trạm) đẩy vào cổng nhận dữ liệu.
2. Xuất file (CSV, FIT, Excel) → trang "Nhập file": chọn mẫu ánh xạ (`import_mappings`: cột nào là SBD/tên, cột nào là giá trị,
   đơn vị, định dạng thời gian), xem trước, ghép SBD, bản ghi không ghép được vào hàng chờ.
3. Chỉ hiện số → chụp màn hình trên tablet, đọc số (OCR), người xác nhận rồi lưu (source = FILE, evidence = ảnh).
4. Nhập tay.

Việc đầu tiên khi có danh sách thiết bị: xếp từng model vào bậc, ghi vào bảng dưới.

| Thiết bị câu lạc bộ | Đo gì | Bậc | Ghi chú |
| --- | --- | --- | --- |
| (chờ danh sách) | | | |

## Thiết bị tự phát triển

Mã nguồn đặt trong `devices/` (firmware ESP32 dùng PlatformIO, app thu trên laptop/điện thoại). Chung một thư viện nhỏ: cấu
hình token + trạm qua QR, gắn SBD (quét QR phiếu SBD hoặc RFID), hàng đợi offline, gửi lô vào cổng nhận dữ liệu.

| ID | Thiết bị | Cách làm | Ghi chú |
| --- | --- | --- | --- |
| 3.3 | Nhịp tim | Đồng hồ Garmin bật phát nhịp tim / đai chuẩn BLE + ANT+; một máy thu (USB ANT+ trên laptop) nghe cả nhóm 15 người | Làm đầu tiên: phần cứng mua sẵn. File FIT sau buổi làm bản đối chiếu |
| 3.4 | Cổng sprint/agility | 2–3 cổng tia laser/hồng ngoại + ESP32, đồng bộ giờ qua ESP-NOW, cổng xuất phát nhận tín hiệu bắt đầu | Song song: điện thoại 240 fps ở vạch đích làm bằng chứng |
| 3.5 | Chip RFID UHF | Thẻ dán sau phiếu SBD/giày + đầu đọc và thảm ăng-ten ở vạch | Tự nhận dạng ở trạm và đếm vòng 2.000 m |
| 3.6 | Thảm bật | Thảm tiếp xúc (2 lớp dẫn điện hoặc công tắc dải) + ESP32 đo thời gian bay, h = g·t²/8 | Kiểm bằng video quay chậm |
| 3.7 | Radar sút | Module Doppler + vi điều khiển, xử lý FFT ra km/h | Hoặc camera tốc độ cao |
| 3.8 | Đọc số từ ảnh | OCR trên server cho màn hình số 7 đoạn và phiếu InBody | Dùng cho thiết bị bậc 3 |
| — | GPS di chuyển | Module GPS 10 Hz + IMU ghi thẻ nhớ, tải sau trận | Có thể thay bằng công cụ video (GĐ4) |

Sai số và giá chỉ là ước lượng tới khi có phiếu hiệu chuẩn.
