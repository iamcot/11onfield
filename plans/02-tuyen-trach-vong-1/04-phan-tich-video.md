# GĐ4 · Phân tích video trận đấu

Mục tiêu: một ứng dụng chạy trên máy cá nhân có GPU, nạp video trận (7v7, 11v11), cho ra số liệu di chuyển của từng cầu thủ
để BGK tham khảo, rồi gửi kết quả (JSON) lên máy chủ. Máy chủ không xử lý video.

Điều kiện xong MVP: trên một trận 7v7 thật, quãng đường và tốc độ tối đa lệch so với GPS vest không quá mức chấp nhận được
(chốt khi có số đo đầu tiên), tỷ lệ thời gian theo dõi được ≥ 85% mỗi người.

## Kiến trúc

- Thư mục `tools/match-analyzer/` (Python 3.11): OpenCV, mô hình phát hiện người/bóng (YOLO hoặc RT-DETR; xem giấy phép:
  Ultralytics là AGPL, nếu phát hành công cụ ra ngoài thì chọn mô hình giấy phép Apache), ByteTrack, giao diện web localhost
  (FastAPI + trang tĩnh) để hiệu chuẩn, sửa nhận dạng, duyệt kết quả.
- Đăng nhập bằng token thiết bị (`devices.kind = VIDEO`), gọi `POST /api/ingest/measurements` và `POST /api/ingest/match-tracks`.

## Việc chi tiết

| ID | Việc | Chi tiết |
| --- | --- | --- |
| 4.1 | Khung ứng dụng | Nạp video, cắt đoạn, tải danh sách đội hình (SBD, số áo, đội) từ máy chủ theo trận |
| 4.2 | Hiệu chuẩn sân | Chọn kích thước sân (m), bấm ≥ 4 điểm biết trước, tính homography, lưu theo sân + vị trí camera để dùng lại |
| 4.3 | Phát hiện, bám vết, chia đội | Người + bóng mỗi khung, ByteTrack cho mã track, chia đội theo màu áo (k-means), tách trọng tài/thủ môn |
| 4.4 | Gắn SBD | Đọc số áo khi rõ; còn lại người vận hành bấm cầu thủ chọn SBD; đánh dấu đoạn hai track giao nhau nghi đổi mã để sửa |
| 4.5 | Chỉ số và xuất | Chiếu chân cầu thủ sang toạ độ sân, lọc nhiễu, tính quãng đường, tốc độ tối đa, số sprint, quãng đường theo vùng tốc độ, heatmap, vị trí trung bình; xuất JSON + video có vẽ khung |
| 4.6 | Gửi và xem | Gửi chỉ số (source = VIDEO, kèm độ tin cậy, % thời gian theo dõi) + quỹ đạo rút gọn; trang admin "Phân tích trận" vẽ heatmap, bảng chỉ số, link video |
| 4.7 | Kiểm chứng | So sánh với GPS trên 1 trận 7v7, ghi kết quả vào plan |

Giai đoạn sau MVP: giữ vị trí và độ rộng/sâu đội hình, pressing (cần vị trí bóng), rồi sự kiện chuyền/tranh chấp (độ tin
cậy thấp, cần người xác nhận từng sự kiện).

## Định dạng gửi lên (nháp)

```json
{
  "matchKey": "stage-1/day-2/match-3",
  "calibration": {"pitch": [68, 50], "homography": [[...]]},
  "players": [
    {"sbd": 1042, "trackedRatio": 0.91, "distanceM": 2875, "maxSpeedKmh": 29.4, "sprints": 11,
     "speedZonesM": {"walk": 900, "jog": 1300, "run": 500, "sprint": 175},
     "avgPosition": [31.2, 18.7], "heatmap": {"grid": [12, 8], "cells": [...]}}
  ]
}
```
