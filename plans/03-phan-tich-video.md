# 03 · Công cụ phân tích video trận đấu (độc lập)

> Trạng thái: **nháp để thảo luận** (31/10/2026). Thay cho GĐ4 (`plans/02-tuyen-trach-vong-1/04-phan-tich-video.md`).
> Mục ghi **(giả định)** là đề xuất mặc định, chờ chốt ở mục 11.

## 1. Mục tiêu và phạm vi

Một công cụ **độc lập**: nạp video trận, thiết lập sân và cầu thủ, nhận diện và bám vết, rồi tính ra **measure** (dữ liệu
gốc: toạ độ, tốc độ, kiểm soát bóng, sự kiện) và **metric** theo chuẩn phân tích bóng đá hiện đại (thể lực, kỹ thuật,
chiến thuật, đội).

- **Không** gắn với luồng chấm điểm, đối soát hay hexagon của 11onfield. Đầu ra là file (JSON, Parquet, CSV, báo cáo HTML,
  video có vẽ khung). Ai muốn dùng (11onfield, HLV, CLB) thì đọc file đó.
- Chạy trên máy có GPU của người dùng; không cần máy chủ.
- Ưu tiên **đúng và kiểm chứng được** hơn nhiều metric: mỗi metric ghi rõ độ phủ dữ liệu và độ tin cậy.

## 2. Pipeline

```
Video ─► 1. Nạp & cắt ─► 2. Thiết lập sân ─► 3. Thiết lập cầu thủ ─► 4. Nhận diện ─► 5. Bám vết
     ─► 6. Định danh (đội, số áo, sửa tay) ─► 7. Chiếu toạ độ sân + làm mượt
     ─► 8. Measures (tracking, kiểm soát bóng, sự kiện) ─► 9. Metrics ─► 10. Báo cáo & xuất
```

| Bước | Làm gì | Đầu ra |
| --- | --- | --- |
| 1. Nạp | Nhiều file một trận (hiệp 1, hiệp 2), đặt mốc bắt đầu/kết thúc hiệp, bỏ đoạn nghỉ | `match.json` (thông tin trận, thời gian) |
| 2. Sân | Chọn mẫu sân, đặt mốc, tính homography (mục 3) | `calibration.json` |
| 3. Cầu thủ | Danh sách hai đội, số áo, vị trí, màu áo (mục 4) | `roster.json` |
| 4. Nhận diện | Mỗi khung: người (cầu thủ, thủ môn, trọng tài) + bóng | detections |
| 5. Bám vết | Nối nhận diện thành track (ByteTrack/BoT-SORT), nội suy khi bị che | tracks |
| 6. Định danh | Chia đội theo màu áo, đọc số áo, gán track → cầu thủ, người sửa các đoạn nghi đổi mã | track → player |
| 7. Toạ độ | Điểm chân → toạ độ sân (m), lọc nhiễu, tính vận tốc, gia tốc | `tracking.parquet` |
| 8. Measures | Kiểm soát bóng, pha bóng, sự kiện (mục 5) | `events.json`, `possession.parquet` |
| 9. Metrics | Tính theo định nghĩa ở mục 6 | `metrics.json`, `metrics.csv` |
| 10. Báo cáo | Báo cáo trận, báo cáo cá nhân, video có vẽ khung, clip theo sự kiện | `report.html`, `annotated.mp4` |

## 3. Thiết lập sân

- **Mẫu sân** (cấu hình): 5v5 (40 × 20 m), 7v7 (50–60 × 30–40 m, nhập kích thước thật), 11v11 (105 × 68 m), hoặc tự nhập.
  Mẫu chứa các điểm biết trước: 4 góc, giao vạch giữa với biên, chấm giữa sân, góc vòng cấm, chấm phạt đền.
- **Hiệu chuẩn tay (MVP)**: người dùng bấm ≥ 4 điểm trên khung hình, khớp với điểm trên sơ đồ; tính homography, hiện lưới
  sân chồng lên video để kiểm tra bằng mắt; báo sai số chiếu lại (reprojection error, mục tiêu < 0,5 m).
- Sửa **méo ống kính** (camera góc rộng, action cam) bằng hiệu chuẩn bàn cờ một lần cho mỗi camera.
- Lưu hiệu chuẩn theo **sân + vị trí camera** để dùng lại cho các trận sau.
- **Camera lia/zoom (sau MVP)**: mô hình nhận điểm mốc sân (keypoint) chạy mỗi khung để có homography theo từng khung.
- Vùng sân (dùng cho metric): 3 phần ba theo chiều dọc, 5 hành lang theo chiều ngang, vòng cấm, lưới 12 × 8 cho xT/heatmap.
  Tự co giãn theo kích thước sân.

## 4. Thiết lập cầu thủ

- **Roster**: mỗi đội có tên, màu áo chính/thủ môn, danh sách cầu thủ (mã, tên, số áo, vị trí, chân thuận nếu có).
  Nhập tay hoặc từ CSV. Mã cầu thủ là mã tự do (có thể là SBD của 11onfield, công cụ không cần biết).
- **Chia đội**: lấy màu vùng thân của mỗi track, gom cụm (k-means) thành đội A, đội B, thủ môn, trọng tài; người dùng xác nhận
  cụm nào là đội nào.
- **Gán track → cầu thủ**:
  - Tự động khi đọc được số áo ổn định qua nhiều khung (OCR chữ số, bỏ phiếu theo track).
  - Còn lại: màn "dòng thời gian track" cho thấy track chưa gán, bấm track rồi chọn cầu thủ.
  - Đánh dấu đoạn nghi đổi mã (hai track cùng đội giao nhau, track mất rồi xuất hiện lại) để người kiểm.
- **Thay người**: ghi giờ vào/ra để metric tính theo phút có mặt.
- Điều kiện quay giúp định danh: áo bib hai màu tương phản, **số áo cỡ lớn cả mặt trước và sau**, thủ môn khác màu.

## 5. Measures (dữ liệu gốc)

Đây là lớp mọi metric đều dựa vào. Lưu riêng để có thể tính lại metric khi đổi định nghĩa mà không chạy lại AI.

### 5.1 Tracking

- Mỗi cầu thủ, mỗi khung (lấy mẫu lại **10 Hz**, chuẩn của dữ liệu tracking thương mại): `t, player_id, x, y, vx, vy, speed,
  accel, visible, confidence`.
- Bóng: `t, x, y, visible, confidence` (chỉ 2D trên mặt sân; bóng bổng có sai số lớn, ghi `in_air` khi nghi ngờ).
- Độ phủ: % thời gian mỗi cầu thủ được theo dõi thật (không nội suy).

### 5.2 Kiểm soát bóng và pha bóng

- **Người giữ bóng** mỗi khung: cầu thủ gần bóng nhất trong ≤ 1,5 m, giữ ≥ 0,3 s **(giả định, tinh chỉnh khi có dữ liệu)**.
- **Đội kiểm soát** và **chuỗi kiểm soát** (possession sequence): từ lúc một đội có bóng tới khi mất bóng hoặc bóng chết.
- **Pha**: tấn công có tổ chức, phòng ngự có tổ chức, chuyển trạng thái tấn công (≤ 10 s sau khi đoạt bóng), chuyển trạng
  thái phòng ngự (≤ 10 s sau khi mất bóng), bóng chết.

### 5.3 Sự kiện

Lược đồ theo kiểu SPADL (chuẩn mở, dễ đổi sang StatsBomb/Opta): mỗi sự kiện có `t, period, team, player, type, result,
start_xy, end_xy, body_part (nếu biết), related_player, source (AUTO|MANUAL), confidence, reviewed`.

| Loại | Suy ra từ tracking + bóng |
| --- | --- |
| `pass` / `reception` | Bóng rời người A, tới người B cùng đội (thành công) hoặc đội kia/ra ngoài (hỏng) |
| `carry` | Cầu thủ giữ bóng di chuyển ≥ 3 m |
| `take_on` | Carry vượt qua một đối thủ đang áp sát (≤ 2 m), sau đó vẫn giữ bóng |
| `duel` | Hai cầu thủ hai đội cùng trong 1,5 m quanh bóng ≥ 0,5 s; người giữ bóng sau đó thắng |
| `interception` / `recovery` | Đoạt bóng từ đường chuyền / nhặt bóng tự do |
| `pressure` | Cầu thủ phòng ngự lao về người có bóng, khoảng cách ≤ 5 m và đang giảm |
| `shot` | Bóng đi nhanh về khung thành, kết thúc ở vạch cuối/khung thành/thủ môn |
| `clearance`, `out`, `foul`, `set_piece` | Bóng ra ngoài; dừng trận và phạt; gắn tay ở MVP |

- Sự kiện tự động luôn qua **màn duyệt**: phát đoạn 4 giây, Đúng / Sai / Sửa, có phím tắt. Có thể **gắn tay** sự kiện thiếu.
- Độ tin cậy của mỗi loại sự kiện được đo so với bộ gắn tay chuẩn (mục 8); loại nào chưa đạt ngưỡng thì metric của nó ghi
  "thử nghiệm".

## 6. Metrics theo chuẩn hiện đại

Định nghĩa là **cấu hình có phiên bản**; mọi ngưỡng khoảng cách tự **co giãn theo chiều dài sân** so với sân 105 m (sân 7v7
ngắn hơn, nên "chuyền tịnh tiến 30 m" không có nghĩa nếu giữ nguyên). Mọi metric có thêm bản **mỗi 90 phút** (hoặc mỗi
10 phút cho 7v7) để so người chơi ít/nhiều.

### 6.1 Thể lực (tương đương GPS vest)

| Metric | Định nghĩa |
| --- | --- |
| Tổng quãng đường, m/phút | Tổng quãng đường trên toạ độ đã lọc nhiễu |
| Quãng đường theo vùng tốc độ | Z1 < 7, Z2 7–14,4, Z3 14,4–19,8, Z4 HSR 19,8–25,2, Z5 sprint > 25,2 km/h (chuẩn người lớn) |
| HSR, quãng đường sprint, số lần sprint | Sprint là ≥ ngưỡng Z5 kéo dài ≥ 1 s |
| Tốc độ tối đa | Đỉnh tốc độ sau lọc (bỏ đỉnh do nhảy track) |
| Số lần tăng/giảm tốc | |a| > 3 m/s² kéo dài ≥ 0,5 s |
| Công suất chuyển hoá (tuỳ chọn) | Theo mô hình di Prampero, cho tải tổng hợp |
| Phân bố theo hiệp/15 phút | Thấy độ tụt thể lực |

- **(giả định)** Cầu thủ trẻ: thêm bộ ngưỡng U15–U19 (ví dụ HSR > 18, sprint > 21 km/h) hoặc ngưỡng **tương đối** theo tốc độ
  tối đa của chính cầu thủ (HSR > 60%, sprint > 80%). Chọn bộ ngưỡng khi chạy.

### 6.2 Kỹ thuật, có bóng

| Metric | Định nghĩa |
| --- | --- |
| Số chuyền, tỷ lệ chính xác | Theo `pass` thành công / tổng; tách ngắn/trung/dài, theo hướng |
| Chuyền tịnh tiến (progressive) | Đưa bóng gần khung thành đối phương hơn ≥ 30 m (phần sân nhà), ≥ 15 m (qua giữa sân), ≥ 10 m (phần sân đối phương); co theo sân |
| Chuyền vào 1/3 cuối, vào vòng cấm | Điểm kết thúc nằm trong vùng đó |
| Key pass, xA | Chuyền ngay trước một cú sút; xA = xG của cú sút đó |
| Carry, carry tịnh tiến | Như chuyền tịnh tiến nhưng bằng dẫn bóng |
| Qua người | Số lần, tỷ lệ thành công |
| Sút, sút trúng đích, xG | xG theo vị trí, góc, khoảng cách, số người chắn trong tam giác sút (có tracking nên tính được) |
| xT (Expected Threat) | Giá trị tăng thêm của mỗi lần chuyền/carry theo lưới xT 12 × 8 |
| Mất bóng, chạm bóng theo vùng | Số lần mất bóng; bản đồ chạm bóng |

### 6.3 Phòng ngự, không bóng

| Metric | Định nghĩa |
| --- | --- |
| Tranh chấp, tỷ lệ thắng | Theo `duel` |
| Cắt bóng, thu hồi, vị trí thu hồi | Theo `interception`/`recovery`, cao bao nhiêu trên sân |
| Áp sát (pressures), áp sát thành công | Áp sát dẫn tới đội mình có bóng trong ≤ 5 s |
| Phản pressing | Áp sát trong ≤ 5 s sau khi đội mất bóng |
| Áp lực khi nhận bóng | Khoảng cách tới đối thủ gần nhất lúc cầu thủ nhận bóng |
| Chạy chỗ không bóng | Pha chạy ≥ HSR về phía khung thành hoặc sau lưng hàng thủ khi đội có bóng |
| Kiểm soát không gian (pitch control) | Diện tích sân cầu thủ/đội "tới trước" theo mô hình thời gian tới điểm (Spearman) |

### 6.4 Đội và chiến thuật

| Metric | Định nghĩa |
| --- | --- |
| Kiểm soát bóng %, field tilt | Thời gian có bóng; tỷ lệ chạm bóng ở 1/3 cuối của mỗi đội |
| PPDA | Số đường chuyền của đối phương ở 60% sân của họ / số hành động phòng ngự của đội ở vùng đó (thấp = pressing mạnh) |
| Chiều cao hàng thủ, độ dài, độ rộng đội hình | Từ toạ độ cầu thủ ngoài sân (bỏ thủ môn), khi có bóng và khi không |
| Độ co cụm | Diện tích bao lồi (convex hull) của đội, khoảng cách giữa các tuyến |
| Sơ đồ trung bình | Vị trí trung bình mỗi người theo pha có bóng/không bóng |
| Mạng chuyền | Đỉnh = vị trí trung bình, cạnh = số đường chuyền giữa hai người; độ trung tâm |
| Chuyển trạng thái | Thời gian từ đoạt bóng tới cú sút/vào 1/3 cuối; tốc độ tịnh tiến |
| xG cho/chống, chuỗi tạo cơ hội | Tổng xG; các chuỗi kiểm soát kết thúc bằng sút |

### 6.5 Mô hình cần huấn luyện/hiệu chỉnh

- **xG**: mô hình logistic/gradient boosting trên dữ liệu mở (StatsBomb Open Data, cần kiểm điều khoản), hiệu chỉnh cho
  sân nhỏ và cầu thủ trẻ khi có đủ cú sút của chính giải.
- **xT**: lưới công khai (Karun Singh) để bắt đầu, sau tính lại từ dữ liệu của mình.
- **Pitch control**: mô hình Spearman (2018) dùng vận tốc từ tracking, không cần huấn luyện.

## 7. Lộ trình từ MVP tới hoàn chỉnh

| Mức | Có gì | Metric có được |
| --- | --- | --- |
| **M0** | Thu 3–5 video mẫu đúng điều kiện quay; thử nhanh mô hình phát hiện | Không (chốt phần cứng và cách quay) |
| **M1 · MVP** | Camera cố định, hiệu chuẩn tay, nhận diện + bám vết người, chia đội màu áo, gán cầu thủ bằng tay có hỗ trợ, toạ độ 10 Hz | 6.1 thể lực đầy đủ; heatmap, vị trí trung bình, hình dạng đội hình (6.4 phần không cần bóng) |
| **M2** | Phát hiện + bám vết bóng, người giữ bóng, chuỗi kiểm soát, sự kiện tự động + màn duyệt + gắn tay | 6.2 cơ bản (chuyền, carry, qua người, sút), 6.3 tranh chấp/thu hồi/áp sát, 6.4 kiểm soát bóng, PPDA, field tilt, mạng chuyền |
| **M3** | Mô hình: xG, xT, pitch control; OCR số áo tự động; camera lia (homography theo khung) | xG, xA, xT, kiểm soát không gian, chạy chỗ, áp lực khi nhận bóng, phản pressing |
| **M4 · Hoàn chỉnh** | Nhiều camera, sân 11v11, xử lý theo lô/GPU đám mây, so sánh nhiều trận, phân vị theo vị trí/lứa tuổi, xuất chuẩn mở (SPADL, tracking theo định dạng chung), đóng gói cài đặt | Báo cáo cầu thủ theo mùa, hồ sơ so sánh |

Điều kiện xong mỗi mức ở mục 8.

## 8. Kiểm chứng

| Hạng mục | Cách đo | Mục tiêu **(giả định, chốt sau dữ liệu đầu)** |
| --- | --- | --- |
| Hiệu chuẩn | Đo thực tế 10 điểm trên sân, so với toạ độ chiếu | Sai số < 0,5 m (camera cố định) |
| Theo dõi | % thời gian mỗi cầu thủ được theo dõi, số lần đổi mã / trận | ≥ 90% người ngoài sân; ≤ 5 lần đổi mã cần sửa / 10 phút |
| Thể lực | So với GPS vest trên cùng trận | Quãng đường lệch ≤ 5%, tốc độ tối đa ≤ 1,5 km/h, số sprint ≤ 15% |
| Bóng | % khung bóng trong cuộc được phát hiện | ≥ 70% (sân 7v7, camera cao) |
| Sự kiện | Precision/recall theo loại, so với gắn tay của 2 người trên 3 trận | Chuyền ≥ 85%/75%; tranh chấp, thu hồi ≥ 70%/60% |
| Hiệu năng | Thời gian xử lý trận 2 × 25 phút, 1080p | ≤ 1,5 lần thời lượng trên GPU 8–12 GB |

Bộ gắn tay chuẩn (3 trận) là việc phải làm sớm: vừa để đo, vừa là dữ liệu tinh chỉnh mô hình.

## 9. Kiến trúc kỹ thuật

- **Repo/thư mục**: `tools/match-analyzer/` trong repo này **(giả định)** hoặc repo riêng nếu muốn phát hành độc lập.
- **Python 3.11**: OpenCV, PyTorch, `supervision` (vẽ, tiện ích track), ByteTrack/BoT-SORT, pandas/Polars + Parquet.
- **Giao diện**: web chạy localhost (FastAPI + trang React/Vite tĩnh): thiết lập sân, roster, dòng thời gian track, duyệt sự
  kiện, xem báo cáo. Một lệnh CLI cho chạy theo lô: `analyzer run project/`.
- **Thư mục dự án mỗi trận**: `match.json`, `calibration.json`, `roster.json`, `detections/`, `tracking.parquet`,
  `events.json`, `metrics.json`, `report.html`, `annotated.mp4`. Mỗi bước đọc đầu ra bước trước, chạy lại được từng bước.
- **Mô hình** và giấy phép:
  - Phát hiện người/bóng: RT-DETR hoặc YOLOX (Apache 2.0). Tránh Ultralytics YOLO (AGPL) nếu định phát hành đóng.
  - Tinh chỉnh trên ảnh sân của mình; dữ liệu mở như SoccerNet (tracking, calibration) dùng để khởi đầu, **cần kiểm điều
    khoản** (một số bộ chỉ cho nghiên cứu).
  - OCR số áo: mô hình phân loại chữ số nhỏ, huấn luyện trên ảnh cắt từ video của mình.
- **Phần cứng (giả định)**: GPU NVIDIA ≥ 8 GB VRAM (RTX 3060–4070), 32 GB RAM, SSD.
- **Điều kiện quay**: camera cố định cao 4–6 m giữa biên dọc, thấy trọn sân, 1080p 50/60 fps hoặc 4K 30 fps, khoá zoom/phơi
  sáng; áo bib số lớn; mốc sân rõ.

## 10. Bảng việc

Trạng thái: `Chưa làm` · `Đang làm` · `Review` · `Xong` · `Chờ chốt`.

| ID | Việc | Mức | Phụ thuộc | Trạng thái |
| --- | --- | --- | --- | --- |
| A0.1 | Hướng dẫn quay + thu 3–5 video mẫu (có 1 trận đeo GPS) | M0 | — | Chờ chốt |
| A0.2 | Thử nhanh 2–3 mô hình phát hiện trên video mẫu, chọn mô hình + phần cứng | M0 | A0.1 | Chưa làm |
| A0.3 | Gắn tay chuẩn 3 trận (vị trí bóng theo mốc, sự kiện) | M0 | A0.1 | Chưa làm |
| A1.1 | Khung ứng dụng: thư mục dự án trận, CLI, web localhost, nạp video nhiều phần, đặt mốc hiệp | M1 | — | Chưa làm |
| A1.2 | Thiết lập sân: mẫu sân, bấm mốc, homography, lưới kiểm tra, sửa méo, lưu theo sân/camera | M1 | A1.1 | Chưa làm |
| A1.3 | Roster: nhập tay/CSV, màu áo, thay người | M1 | A1.1 | Chưa làm |
| A1.4 | Nhận diện + bám vết người, chia đội theo màu áo | M1 | A0.2 | Chưa làm |
| A1.5 | Định danh: dòng thời gian track, gán cầu thủ, đoạn nghi đổi mã | M1 | A1.3, A1.4 | Chưa làm |
| A1.6 | Toạ độ sân 10 Hz, lọc nhiễu, vận tốc/gia tốc → `tracking.parquet` | M1 | A1.2, A1.5 | Chưa làm |
| A1.7 | Metric thể lực (6.1) + heatmap + hình dạng đội hình | M1 | A1.6 | Chưa làm |
| A1.8 | Báo cáo HTML, video có vẽ khung, xuất CSV/JSON | M1 | A1.7 | Chưa làm |
| A1.9 | Kiểm chứng với GPS, ghi kết quả vào file này | M1 | A1.7 | Chưa làm |
| A2.1 | Phát hiện + bám vết bóng, nội suy | M2 | A1.4 | Chưa làm |
| A2.2 | Người giữ bóng, chuỗi kiểm soát, pha bóng | M2 | A2.1, A1.6 | Chưa làm |
| A2.3 | Suy sự kiện (lược đồ SPADL) | M2 | A2.2 | Chưa làm |
| A2.4 | Màn duyệt + gắn tay sự kiện, phím tắt, clip theo sự kiện | M2 | A2.3 | Chưa làm |
| A2.5 | Metric 6.2–6.4 phần không cần mô hình; đo precision/recall với A0.3 | M2 | A2.4, A0.3 | Chưa làm |
| A3.1 | xG, xA, xT | M3 | A2.5 | Chưa làm |
| A3.2 | Pitch control, áp lực khi nhận bóng, chạy chỗ, phản pressing | M3 | A2.5 | Chưa làm |
| A3.3 | OCR số áo tự gán cầu thủ | M3 | A1.5 | Chưa làm |
| A3.4 | Camera lia/zoom: nhận mốc sân mỗi khung | M3 | A1.2 | Chưa làm |
| A4.1 | Nhiều camera, sân 11v11 | M4 | A3.4 | Chưa làm |
| A4.2 | Xử lý theo lô, GPU đám mây tuỳ chọn | M4 | A1.8 | Chưa làm |
| A4.3 | So sánh nhiều trận, phân vị theo vị trí/lứa tuổi, báo cáo cầu thủ theo mùa | M4 | A2.5 | Chưa làm |
| A4.4 | Xuất chuẩn mở, đóng gói cài đặt (Windows/Linux) | M4 | A1.8 | Chưa làm |

## 11. Câu hỏi cần chốt

- [ ] Quay bằng gì: camera cố định trên cao, điện thoại trên chân máy, hay camera AI có sẵn (Veo, Pixellot…)? Camera có lia không?
- [ ] Loại trận ưu tiên: 7v7 (kích thước sân thật?) trước, 11v11 sau?
- [ ] Có áo bib in số cỡ lớn không?
- [ ] Máy xử lý: có GPU NVIDIA nào sẵn chưa, hay mua/thuê?
- [ ] Có GPS vest để kiểm chứng không, hãng nào?
- [ ] Bộ ngưỡng tốc độ: chuẩn người lớn, theo lứa tuổi, hay tương đối theo từng cầu thủ?
- [ ] Công cụ chỉ dùng nội bộ hay có thể phát hành/bán (quyết định chọn mô hình theo giấy phép)?
- [ ] Đặt trong repo này (`tools/match-analyzer/`) hay repo riêng?
