# Nghiên cứu: cách đo tốc độ chạy, bật cao, bật xa, lực sút

Bắt đầu 2026-10-31. Tài liệu nghiên cứu, chưa code. Bổ sung cho [03-thiet-bi-do.md](03-thiet-bi-do.md) (GĐ3) và cổng nhận
dữ liệu `POST /api/ingest/measurements` (việc 1.6 trong [01-du-lieu-va-tinh-diem.md](01-du-lieu-va-tinh-diem.md)).

Giá ghi bằng USD, quy đổi khoảng 26.000 đ/USD, là giá tham khảo cần hỏi lại nhà cung cấp. Sai số là ước lượng từ nguyên lý và
tài liệu đã công bố; con số thật của từng thiết bị chỉ có sau phiếu hiệu chuẩn (mục 7).

## 0. Kết luận nhanh

| Bài | Cách đo chính (khuyến nghị) | Bằng chứng / đối chiếu | Sai số mục tiêu |
| --- | --- | --- | --- |
| Sprint 30 m | Cổng hồng ngoại **2 tia** tự làm (ESP32), 3 cổng 0/10/30 m, nối dây hoặc đồng bộ đồng hồ | Điện thoại 240 fps đặt thẳng vạch đích | ≤ 0,02 s |
| Agility | Cùng bộ cổng, chế độ một cổng đi qua nhiều lần (có thời gian khoá) | Video 240 fps | ≤ 0,03 s |
| 2.000 m | Bấm tay + chip RFID UHF đếm vòng (hoặc GPS 10 Hz) | Danh sách vòng | ≤ 1 s |
| Bật cao | **Chốt định nghĩa trước** (xem 3.3). Nếu đo thời gian bay: thảm tiếp xúc tự làm; nếu đo với tay: thước Vertec | Video 240 fps quay ngang chân | ≤ 1 cm |
| Bật xa | Thảm in vạch cm + ảnh chụp từ trên (tự đọc bằng mốc ArUco), hoặc thước dây | Ảnh lưu kèm bản ghi | ≤ 1–2 cm |
| Tốc độ sút | Radar Doppler 24 GHz có sẵn bộ xử lý (OPS243 hoặc Pocket Radar) đặt sau quả bóng, thẳng hướng sút | Video 240 fps | ≤ 2 km/h |
| Chiều cao | Thước đo chuẩn; tuỳ chọn trụ siêu âm có bù nhiệt | | ≤ 0,5 cm |

Ba điều quyết định độ lệch nhiều hơn chọn thiết bị:

1. **Định nghĩa phép đo** (xuất phát kiểu gì, tính "bật cao" là gì, đo tốc độ bóng ở đâu). Ngưỡng 5 màu chỉ đúng với đúng
   một quy trình; đổi quy trình là đổi số 0,2–0,3 s ở sprint hoặc hơn chục cm ở bật cao.
2. **Mọi trạm dùng cùng bố trí và cùng loại thiết bị ở cả 3 khu vực**, vì bảng xếp hạng là chung.
3. **Hiệu chuẩn trước giải + kiểm tra 5 phút đầu mỗi ngày**, lưu phiếu vào `device_calibrations`.

## 1. Cần chính xác đến đâu

Sai số chấp nhận được suy từ độ rộng một mức trong thang 5 màu: thiết bị nên sai không quá khoảng 1/5 đến 1/10 độ rộng một mức,
nếu không thí sinh sát ngưỡng sẽ nhảy màu do thiết bị (hệ thống đã có cờ NEAR_BOUNDARY, việc 1.8, dùng chính con số sai số này).

| Bài | Độ rộng một mức (theo ảnh quy trình) | Sai số nên đạt | Bấm tay thì sao |
| --- | --- | --- | --- |
| Sprint 30 m | khoảng 0,2–0,3 s | ≤ 0,02–0,03 s | Bấm tay lệch 0,1–0,3 s và lệch theo từng người bấm: không dùng được làm số chính |
| Bật cao | khoảng 5 cm | ≤ 1 cm | Đọc thước Vertec ±1 cm, ổn |
| Bật xa | khoảng 10 cm | ≤ 2 cm | Thước dây ±1 cm nếu đặt đúng điểm gót sau |
| Tốc độ sút | khoảng 10 km/h | ≤ 2 km/h | Không đo tay được |
| 2.000 m | vài chục giây | ≤ 1 s | Bấm tay đủ |

## 2. Từng công nghệ

### 2.1 Camera tốc độ cao (điện thoại 240 fps)

**Nguyên lý.** Mỗi khung cách nhau 1/240 s = 4,17 ms. Đếm số khung giữa hai sự kiện (rời đất / chạm đất, qua vạch xuất phát /
vạch đích) ra thời gian; đo dịch chuyển của vật qua các khung ra tốc độ.

**Độ chính xác.**
- Thời gian: mỗi sự kiện lệch tối đa ±1 khung, nên một khoảng thời gian lệch tối đa khoảng ±8 ms. Với sprint 30 m (khoảng 4,5 s)
  là dưới 0,2%; với thời gian bay khi bật (0,5 s) là ±0,5–1 cm chiều cao.
- Tốc độ bóng: ở 30 m/s bóng đi 12,5 cm mỗi khung. Khớp đường thẳng qua 10–15 khung cho sai số khoảng 1–3% **nếu** thước tỉ lệ
  đúng. Lỗi lớn nhất là thị sai: bóng lệch khỏi mặt phẳng hiệu chuẩn d mét khi camera cách D mét thì tỉ lệ sai d/D (lệch 0,3 m ở
  6 m là sai 5%).

**Nguồn sai số cần chặn.**
- Nhiều máy Android quay "slow motion" bằng **nội suy khung** hoặc **tốc độ khung thay đổi (VFR)**. Phải đọc dấu thời gian thật
  của từng khung (`ffprobe -show_frames`) chứ không giả định đều 240. iPhone 8 trở lên quay 240 fps thật ở 1080p.
- Màn trập cuộn (rolling shutter) làm bóng/chân bị méo ở tốc độ cao: quay ngoài trời đủ sáng để tốc độ màn trập ≤ 1/1000 s.
- Camera không thẳng vạch: người chạy qua vạch ở xa camera sẽ trông như qua sớm hoặc muộn. Camera phải đặt **đúng trên đường
  kéo dài của vạch đích**, ngắm theo hai cọc mốc ở hai đầu vạch.
- Sprint cần cả vạch xuất phát và vạch đích cách 30 m: một camera không nhìn chuẩn được cả hai. Cần hai điện thoại đồng bộ bằng
  một sự kiện chung (đèn LED nháy từ ESP32 mà cả hai cùng thấy) hoặc dùng app chuyên (Photo Finish, SprintTimer… liên kết
  nhiều máy); cách này làm được nhưng thao tác chậm cho 1.000 thí sinh.

**Kết nối, xây dựng.** Không cần phần cứng ngoài chân máy và mốc. Video tải lên kho, công cụ GĐ4 hoặc một trang nhỏ trong admin
cho người vận hành bấm khung bắt đầu / kết thúc, gửi kết quả với `source = VIDEO`.

**Chi phí.** Điện thoại có sẵn; chân máy + mốc khoảng 30–50 USD.

**Vai trò khuyến nghị.** Thước chuẩn để hiệu chuẩn mọi thiết bị khác, và bằng chứng lưu kèm khi có tranh cãi. Không làm nguồn số
chính cho 1.000 người vì mỗi lượt cần người bấm khung.

### 2.2 Cổng hồng ngoại / laser (photocell)

**Nguyên lý.** Một tia sáng chắn ngang làn chạy; người chạy cắt tia thì vi điều khiển ghi dấu thời gian (độ phân giải µs).
Hai kiểu: phát và thu ở hai bên (xuyên tia) hoặc phát và thu cùng một bên với tấm phản quang bên kia (dễ dựng, chỉ cấp điện một
phía).

**Độ chính xác.** Bản thân mạch điện tử đạt dưới 1 ms. Sai số thật nằm ở **bộ phận nào cắt tia**:
- Cổng **một tia** đặt ngang hông có thể bị tay hoặc đùi đánh trước thân 20–30 cm; ở 8 m/s là lệch 25–40 ms, đủ đổi màu.
- Cổng **hai tia** (hai tia cách nhau theo chiều dọc, chỉ tính khi cả hai cùng bị cắt trong khoảng vài ms, hoặc lấy tia thứ hai)
  gần như loại được lỗi tay chân. Các hệ thống thương mại tốt (Witty, Smartspeed, Brower) đều dùng kiểu này hoặc có chế độ này.
- Xuất phát: cổng đầu tiên bấm giờ khi người chạy đi qua (xuất phát đứng, mũi chân sau vạch 0,5 m) khác hẳn kiểu bấm giờ khi chân
  rời bàn đạp; chênh nhau 0,2–0,3 s. **Phải chốt một kiểu và ghi vào cấu hình nội dung thi.**

**Nguồn sai số khác.**
- Nắng chiếu thẳng vào bộ thu: dùng hồng ngoại **điều chế** (LED 38 kHz + mắt thu kiểu TSOP) hoặc laser + ống che sáng.
- Cổng không cùng độ cao, không vuông góc làn: đo bằng thước dây thép, nivo; khoảng cách sai 1 cm trên 30 m chỉ là 0,03%.
- Đồng bộ đồng hồ giữa các cổng (xem bên dưới).

**Kết nối, xây dựng (DIY).**
- Mỗi cổng: ESP32, module laser 5 mW hoặc LED hồng ngoại điều chế, mắt thu, tấm phản quang, chân máy, pin 18650.
- Đồng bộ các cổng, theo thứ tự chính xác giảm dần:
  1. **Nối dây** về một ESP32 trung tâm (cáp mạng 30–40 m): một đồng hồ duy nhất, sai số µs, rẻ và chắc nhất. Khuyến nghị cho
     sprint.
  2. **Không dây, mỗi cổng tự đóng dấu thời gian**: cổng trung tâm phát gói đồng bộ ESP-NOW vài lần mỗi giây, mỗi cổng tính độ
     lệch đồng hồ theo kiểu NTP (đo vòng đi về), ghi dấu thời gian cục bộ khi tia bị cắt rồi mới gửi. Sai số đạt 0,1–1 ms.
     Thạch anh lệch 20 ppm chỉ trôi 0,1 ms trong 5 s nên không đáng kể.
  3. Không dây kiểu "cổng gửi tin ngay khi bị cắt, máy trung tâm ghi giờ nhận": độ trễ sóng dao động vài ms đến vài chục ms khi
     mạng bận. **Không dùng.**
- Agility: một cổng bị đi qua nhiều lần, cần thời gian khoá (ví dụ 0,5 s) để chân thứ hai không tạo lần cắt mới.

**Chi phí.** DIY khoảng 40–60 USD mỗi cổng một tia, gấp đôi phần cảm biến cho hai tia; bộ 3 cổng hai tia khoảng 200–300 USD
(5–8 triệu đồng). Thương mại: Dashr khoảng 1.000 USD trở lên, Witty / Smartspeed / Brower 3.000–6.000 USD cho bộ 3–4 cổng.
Freelap dùng nguyên lý khác (cột phát từ trường + chip đeo), sai số khoảng 0,02 s, giá tương đương.

**Vai trò khuyến nghị.** Nguồn số chính cho sprint và agility.

### 2.3 Radar Doppler (tốc độ sút)

**Nguyên lý.** Radar phát sóng tần số f₀, vật chuyển động làm sóng phản xạ lệch tần số f_d = 2·v·f₀/c. Với module 24,125 GHz,
1 km/h ứng với khoảng 44,7 Hz; bóng 150 km/h cho 6,7 kHz. Với module 10,525 GHz (HB100) là 19,5 Hz mỗi km/h. Phân tích FFT tìm
đỉnh tần số ra tốc độ.

**Độ chính xác.** Radar tốt sai ±1–2 km/h. Nguồn sai số:
- **Sai số cosin**: radar chỉ đo thành phần tốc độ dọc theo trục nhìn, luôn đọc **thấp hơn**: lệch 10° là thấp 1,5%, 20° thấp 6%,
  30° thấp 13%. Đặt radar thẳng hàng hướng sút, góc lệch dưới 10°.
- **Đo ở đâu trên đường bay**: bóng giảm tốc nhanh do lực cản; với bóng số 5, sau 11 m tốc độ còn khoảng 86–89% tốc độ lúc rời
  chân. Radar bắt **tốc độ lớn nhất** ngay sau cú chạm nên phải nhìn thấy bóng từ lúc rời chân. Đặt radar sau lưng người sút
  (2–3 m, cao ngang bóng) nhìn theo hướng sút, hoặc sau khung thành nhìn ngược lại (lưới không cản sóng).
- Vật khác chuyển động trong chùm sóng (chân người sút, người nhặt bóng): radar thể thao lọc theo đỉnh tốc độ lớn nhất trong cửa
  sổ ngắn, chân chậm hơn bóng nên ít ảnh hưởng; vẫn cần dọn người khỏi vùng nhìn.
- Bóng: cùng cỡ, cùng áp suất (kiểm bằng đồng hồ áp suất đầu ngày), vì bóng non hơi bay chậm hơn.

**Kết nối, xây dựng.**
- **Khuyến nghị: OmniPreSense OPS243-A** (24 GHz, đã có FFT trên module, xuất tốc độ qua USB/UART). Nối ESP32 hoặc thẳng vào
  laptop, lấy giá trị lớn nhất trong 1 s sau khi phát hiện vật vượt 20 km/h. Khoảng 200–300 USD.
- Mua sẵn: Pocket Radar Smart Coach (khoảng 400 USD, có app và Bluetooth), Stalker Pro / Sport (1.000–2.000 USD).
- DIY thuần (HB100 hoặc CDM324, khoảng 5–15 USD): tín hiệu ra rất nhỏ, cần mạch khuếch đại op-amp (hệ số 1.000 lần trở lên, lọc
  thông dải), lấy mẫu ≥ 16 kHz cho module 24 GHz, tự viết FFT. Làm được nhưng mất công chỉnh và dễ nhiễu; chỉ chọn nếu muốn học.

**Vai trò khuyến nghị.** Nguồn số chính cho tốc độ sút. "Lực sút" thực tế đo qua tốc độ bóng; lực thật cần bóng gắn cảm biến
hoặc bàn lực, không đáng làm cho vòng 1.

### 2.4 Sonar / cảm biến siêu âm (HC-SR04, JSN-SR04T…)

**Nguyên lý.** Phát xung siêu âm 40 kHz, đo thời gian vọng lại, khoảng cách = v_âm·t/2.

**Độ chính xác và giới hạn.** Tốt ±0,3–1 cm trong 2–4 m, nhưng: chùm sóng rộng khoảng 15°, cập nhật chỉ 20–40 lần/s, tốc độ âm
thay đổi 0,17% mỗi °C (sân 35 °C khác 20 °C là 2,6%) nên phải bù nhiệt. Không đo được người chạy nhanh hay bóng bay.

**Dùng được vào việc gì.** Trụ đo **chiều cao đứng** (cảm biến gắn trên cao nhìn xuống đỉnh đầu, có cảm biến nhiệt độ bù), có thể
nối thẳng vào trạm thể hình. Khoảng 20–30 USD. Không khuyến nghị cho sprint, nhảy, sút.

**Thay thế đáng cân nhắc: LiDAR 1 điểm** (dòng Benewake TF-Luna / TF02 / TF03). Đo bằng thời gian bay của ánh sáng, tần số hàng
trăm đến hàng nghìn lần/s, tầm 8–100 m tuỳ loại, 30–250 USD. Đặt sau vạch xuất phát nhắm vào lưng người chạy thì thu được **cả
đường cong tốc độ** (giống súng laser LAVEG trong nghiên cứu), tách được 5 m, 10 m, 20 m, tốc độ tối đa mà không cần thêm cổng.
Nhược điểm: tia phải bám đúng thân người, dữ liệu nhiễu cần làm mượt. Để giai đoạn sau.

### 2.5 RFID

Ba loại khác nhau hoàn toàn:

| Loại | Tầm | Dùng được cho | Không dùng được cho |
| --- | --- | --- | --- |
| HF / NFC 13,56 MHz (thẻ chạm) | vài cm | Nhận dạng thí sinh ở trạm: chạm thẻ SBD vào đầu đọc (RC522 2 USD) thay cho quét QR | Đo thời gian |
| UHF thụ động 860–960 MHz (chip dán) | 1–10 m | Đếm vòng và giờ qua vạch ở 2.000 m; tự nhận dạng khi qua cổng | Sprint: thẻ bị đọc nhiều lần khi đi qua vùng ăng-ten, lấy đỉnh RSSI, sai số 0,1–0,5 s |
| Chủ động (MYLAPS ProChip…) | vài m | Giờ qua vạch chính xác cỡ ms | Đắt, không đáng cho vòng 1 |

**UHF cho 2.000 m.** Đầu đọc UHF (module Impinj R2000 hoặc tương đương, 150–400 USD) + thảm hoặc tấm ăng-ten đặt ở vạch, chip dán
mặt sau phiếu SBD hoặc buộc giày (0,1–0,5 USD/chip). Lấy lần đọc có RSSI cao nhất trong mỗi lần đi qua làm giờ qua vạch, bỏ các
lần đọc trong vòng 20 s sau đó. Chip dán ngực bị cơ thể (nhiều nước) che sóng: dán ở giày hoặc vai, thử thực tế trước.

**RFID làm nhận dạng cho cổng sprint.** Có thể đặt đầu đọc UHF ở vạch xuất phát để tự gắn SBD vào lượt chạy, bỏ bước quét QR.

### 2.6 UWB (Ultra-wideband) và GPS

- **UWB** (module Qorvo DWM1000 / DWM3000): đo khoảng cách bằng thời gian bay sóng radio, định vị ±10–30 cm, cần 4+ cột mốc quanh
  sân. Dùng để theo dõi vị trí trong trận (giống Kinexon); với sprint 30 m thì vị trí ±10 cm ở 10–20 lần/s cho thời gian kém cổng
  hồng ngoại. DIY làm được nhưng là một dự án riêng (thuật toán TDoA, đồng bộ cột mốc); để sau GĐ4, so sánh với phân tích video.
- **GPS 10 Hz**: đủ cho quãng đường, tốc độ tối đa thô trong trận và 2.000 m; sai số thời gian sprint 0,1–0,2 s trở lên nên
  không dùng cho sprint.

### 2.7 Thảm bật (thảm tiếp xúc) và các cách đo bật cao

**Thảm tiếp xúc.** Hai lớp dẫn điện ngăn bởi lớp xốp có lỗ; đứng lên thì hai lớp chạm nhau, nhảy lên thì hở. ESP32 đo thời gian
bay t (lấy mẫu 1 kHz trở lên, chống rung tiếp điểm 2–3 ms), chiều cao h = g·t²/8.
- Độ nhạy: với t = 0,5 s (khoảng 31 cm), sai 1 ms thời gian chỉ là 0,12 cm, nên điện tử không phải vấn đề.
- **Sai số lớn nhất là kỹ thuật tiếp đất**: co gối, kiễng chân khi chạm đất kéo dài thời gian bay, chiều cao tăng 1–3 cm hoặc hơn.
  Quy định: hai tay chống hông (hoặc theo quy định chốt), tiếp đất chân thẳng, đúng chỗ cất cánh; lượt sai kỹ thuật bị huỷ.
- DIY: tấm nhôm mỏng hoặc vải dẫn điện + xốp EVA, hoặc 2–4 công tắc dải dài. Khoảng 30–60 USD. Thương mại: Chronojump, Just Jump
  (300–600 USD).

**Cột quang (kiểu OptoJump).** Hai thanh đèn LED hồng ngoại đặt hai bên, đo thời gian bay mà không cần thảm. Thương mại rất đắt
(vài nghìn EUR); DIY bằng dãy LED + mắt thu làm được, cùng nguyên lý cổng hồng ngoại.

**Bàn lực (force plate).** Chuẩn vàng: tính tốc độ cất cánh từ xung lực, không bị ảnh hưởng bởi kiểu tiếp đất. DIY: 4 cảm biến
lực (load cell) + ADC tốc độ cao (ADS1256, ≥ 1.000 mẫu/s; HX711 chỉ 80 mẫu/s là **không đủ**) + tấm thép/ván dày. Khoảng
150–300 USD, hiệu chuẩn bằng tạ đã biết khối lượng. Nên làm 1 bộ để hiệu chuẩn thảm, không cần cho mọi trạm.

**Điện thoại 240 fps (kiểu app My Jump).** Quay ngang bàn chân, bấm khung rời đất và chạm đất. Sai số ±0,5–1 cm, đã được kiểm
chứng với bàn lực trong nhiều nghiên cứu. Dùng làm dự phòng và bằng chứng.

**Thước với (Vertec / bảng tường).** Đo độ cao chạm tay trừ độ cao với khi đứng. Đo được **bật có đà tay và với**, kiểu mà
ngưỡng 60 cm trong ảnh quy trình có vẻ đang dùng (60 cm thời gian bay là rất cao với lứa này). DIY: cột với các thanh gạt cách
nhau 1 cm, hoặc bảng tường có vạch + điện thoại quay chậm.

### 2.8 Bật xa

Kết quả là khoảng cách từ vạch giậm nhảy tới **gót chân gần vạch nhất** khi tiếp đất.
- **Thước dây**: ±1 cm nếu người đo đặt đúng gót sau; lệch phổ biến do đọc nhầm điểm tiếp đất khi người nhảy lùi chân.
- **Thảm in vạch + ảnh từ trên**: thảm in vạch mỗi cm, bốn góc có mốc ArUco. Tablet chụp ngay sau khi tiếp đất, máy tự nắn ảnh
  theo 4 mốc và gợi ý vị trí gót, người đo bấm xác nhận. Ảnh lưu làm bằng chứng. Sai số ±1 cm. Chi phí in thảm khoảng 30–50 USD.
- **Máy đo khoảng cách laser** (Bosch, ±1,5 mm) từ một tấm chắn đặt sau gót: chính xác nhưng thao tác chậm, ít lợi hơn thảm.

### 2.9 Cảm biến quán tính (IMU) đeo người

Gia tốc kế + con quay gắn thắt lưng hoặc giày. Đo được thời gian bay khi nhảy và số bước, nhưng tốc độ chạy suy ra từ tích phân
gia tốc bị trôi nhanh. Không khuyến nghị cho vòng 1; nếu đã có thiết bị GPS vest có IMU thì dùng dữ liệu đó làm tham khảo.

## 3. Bố trí từng trạm (khuyến nghị)

### 3.1 Sprint 30 m

```
  [RFID/QR]   Cổng 0 m        Cổng 10 m                       Cổng 30 m       Điện thoại 240 fps
   xuất phát   ║ (2 tia)       ║ (2 tia)                         ║ (2 tia)       đặt trên đường kéo dài vạch đích
  ──●─0,5m────╫───────────────╫─────────────────────────────────╫──────────── đường giảm tốc ≥ 10 m
              ║               ║                                 ║
              └───────────── cáp tới bộ trung tâm (ESP32) ──────┘
```

- Tia dưới cao khoảng 0,9 m, tia trên khoảng 1,2 m (ngang thân), cùng độ cao ở mọi cổng.
- Xuất phát đứng, mũi chân trước sau vạch 0,5 m, không lắc người trước khi đi; đồng hồ chạy khi cắt cổng 0 m.
- Hai lượt, lấy tốt nhất (theo `scoring_method`). Ghi kèm hướng gió nếu chạy ngoài trời.

### 3.2 Tốc độ sút

- Bóng đặt ở điểm cố định, radar trên chân máy sau bóng 2–3 m, cao 0,3–0,5 m, ngắm thẳng giữa khung thành.
- Sút về khung thành hoặc lưới chắn cách 11 m; radar lấy đỉnh trong 1 s sau cú sút.
- Điện thoại 240 fps quay ngang làm bằng chứng. Nếu radar hỏng, dùng video với hai mốc cách 2 m nằm đúng trên đường bóng.
- Kiểm áp suất bóng đầu mỗi ca.

### 3.3 Bật cao: cần chốt trước

Có ba định nghĩa cho cùng tên "bật cao", ra số khác nhau rất xa:

| Định nghĩa | Đo bằng | Số điển hình nam 16–20 tuổi |
| --- | --- | --- |
| CMJ tay chống hông, theo thời gian bay | Thảm, bàn lực, video | 30–45 cm |
| CMJ có đánh tay, theo thời gian bay | Thảm, video | 35–50 cm |
| Bật với (độ cao chạm tay trừ độ cao với khi đứng) | Vertec, bảng tường | 45–70 cm |

Ngưỡng 60–61 cm trong ảnh quy trình hợp với kiểu "bật với". **Cần BTC xác nhận** trước khi chọn thiết bị; ghi định nghĩa vào mô
tả nội dung thi.

## 4. Gửi dữ liệu về hệ thống

Mọi thiết bị đi vào `POST /api/ingest/measurements` như plan đã chốt. Điểm khó không phải gửi số mà là **gắn số đúng người**.

### 4.1 Gắn SBD với lượt đo

Tablet trạm là iPad (Safari) nên **không có Web Bluetooth / Web Serial**, và trang https không gọi được `ws://` trong mạng nội bộ.
Vì vậy không nên để tablet nói chuyện trực tiếp với thiết bị. Khuyến nghị:

1. Tablet trạm quét QR phiếu SBD (hoặc chạm thẻ NFC) → gọi server "mở lượt": `station`, `sbd`, `attempt`, `opened_at`.
2. Thiết bị đo xong gửi thẳng lên server qua Wi-Fi (router 4G đặt ở sân), kèm `station`, `measured_at`, **không cần biết SBD**.
3. Server gắn bản ghi vào lượt đang mở của trạm đó; tablet nhận kết quả (thăm dò 1 s hoặc SSE) và hiện màu như việc 1.7.
4. Mất mạng: thiết bị lưu hàng đợi trên bộ nhớ flash, tablet giữ hàng đợi IndexedDB như hiện có; khi có mạng, server ghép theo
   `station` + thời gian (lượt mở gần nhất trước `measured_at`). Bản ghi không ghép được vào hàng chờ đối soát.
5. Trạm có đầu đọc RFID ở vạch xuất phát thì thiết bị gửi luôn `sbd`, bỏ bước 1.

Đồng hồ thiết bị đồng bộ NTP mỗi lần bật lên (hoặc nhận giờ từ tablet qua QR cấu hình) để bước ghép theo thời gian không nhầm.

### 4.2 Bổ sung đề xuất cho payload của 1.6

Giữ dữ liệu thô để đối soát và tính lại khi đổi quy trình:

```json
{
  "station": "khu-vuc-1/ngay-1/sprint-30",
  "records": [
    {
      "clientUuid": "6a1f…",
      "sbd": null,
      "assessmentKey": "sprint30",
      "measuredAt": "2026-11-15T07:42:13.512+07:00",
      "value": 4.312,
      "unit": "s",
      "raw": {"gates": [{"id": "G0", "tUs": 0}, {"id": "G10", "tUs": 1748200}, {"id": "G30", "tUs": 4312400}],
              "beamMode": "DUAL_AND"},
      "quality": {"flags": [], "calibrationId": 12},
      "evidenceUrl": null
    }
  ]
}
```

- `sbd` cho phép rỗng (ghép theo trạm + thời gian như 4.1).
- `raw` là JSON tự do theo loại thiết bị (radar: chuỗi tốc độ trong 1 s; thảm: thời điểm rời và chạm; bật xa: ảnh + toạ độ gót).
- `quality.calibrationId` trỏ vào phiếu hiệu chuẩn đang hiệu lực, để biết số đo dựa trên sai số nào.
- `tolerance` của bản ghi lấy từ phiếu hiệu chuẩn, dùng cho cờ NEAR_BOUNDARY.

### 4.3 Kiến trúc phần mềm thiết bị DIY

Khớp với mục "Thiết bị tự phát triển" ở 03-thiet-bi-do.md: firmware ESP32 (PlatformIO) trong `devices/`, chung một thư viện:
cấu hình qua QR (Wi-Fi, token, `station`), đồng bộ giờ, hàng đợi offline, gửi lô HTTPS, màn hình nhỏ hoặc LED báo trạng thái
(sẵn sàng / đang đo / đã gửi / lỗi), nút "huỷ lượt".

## 5. So sánh tổng hợp

| Công nghệ | Đo được | Sai số thực tế | DIY | Chi phí | Đánh giá cho vòng 1 |
| --- | --- | --- | --- | --- | --- |
| Camera 240 fps | Mọi bài (cần người bấm khung) | ±4–8 ms; tốc độ 1–5% tuỳ thị sai | Dễ | Có sẵn | Chuẩn đối chiếu + bằng chứng |
| Cổng hồng ngoại 2 tia | Sprint, agility | ≤ 10 ms nếu bố trí đúng | Trung bình | 200–300 USD / 3 cổng | **Chính cho sprint** |
| Cổng 1 tia | Sprint | 20–40 ms do tay chân | Dễ | 120–180 USD | Chỉ khi thiếu tiền |
| Radar Doppler module có FFT | Tốc độ sút | ±1–2 km/h + sai số cosin | Dễ | 200–400 USD | **Chính cho sút** |
| Radar thuần (HB100) | Tốc độ sút | Tuỳ tay nghề | Khó | 15–30 USD | Không khuyến nghị |
| Sonar | Chiều cao đứng | ±0,5 cm có bù nhiệt | Dễ | 20–30 USD | Tuỳ chọn ở trạm thể hình |
| LiDAR 1 điểm | Đường cong tốc độ sprint | Tốt sau làm mượt | Trung bình | 30–250 USD | Giai đoạn sau |
| RFID NFC | Nhận dạng | | Dễ | 2–5 USD/trạm | Tuỳ chọn thay QR |
| RFID UHF | 2.000 m, nhận dạng tự động | 0,1–0,5 s | Trung bình | 200–500 USD | Cho 2.000 m |
| UWB | Vị trí trong trận | ±10–30 cm | Khó | 200 USD trở lên DIY | Sau GĐ4 |
| GPS 10 Hz | 2.000 m, trận | Thời gian sprint 0,1–0,2 s | Mua | Theo vest | Trận, không cho sprint |
| Thảm tiếp xúc | Bật cao (thời gian bay) | ±0,5 cm điện tử, +1–3 cm nếu tiếp đất sai | Dễ | 30–60 USD | Chính nếu chốt CMJ |
| Bàn lực | Bật cao chuẩn | < 0,5 cm | Trung bình | 150–300 USD | Dùng để hiệu chuẩn thảm |
| Thảm vạch + ảnh ArUco | Bật xa | ±1 cm | Dễ | 30–50 USD | **Chính cho bật xa** |
| IMU | Bật, bước chạy | Trôi | Trung bình | | Không |

## 6. Bảo đảm sai lệch ít nhất: quy tắc chung

1. Một quy trình viết ra cho mỗi bài (xuất phát, tư thế, lượt hợp lệ, lượt huỷ) và in dán ở trạm; nhân viên trạm được tập trước.
2. Cùng mẫu thiết bị, cùng bố trí ở 3 khu vực; thiết bị dự phòng cùng loại.
3. Mỗi lượt có bằng chứng: video 240 fps cho sprint, sút, bật; ảnh cho bật xa. Video chỉ xem khi đối soát, không xử lý mọi lượt.
4. Hai nguồn song song khi có thể (thiết bị + video, thiết bị + nhập tay); luật đối soát 1.8 đã xử lý độ lệch giữa nguồn.
5. Ghi điều kiện môi trường (gió, mặt sân, nhiệt độ) vào ghi chú ngày; chạy sprint cùng hướng ở mọi khu vực nếu được.
6. Ngưỡng hợp lý (`plausible_min/max`) đặt theo định nghĩa đã chốt để bắt số vô lý do lỗi thiết bị.

## 7. Hiệu chuẩn

Điều kiện xong của mỗi thiết bị theo plan: ít nhất 30 lần đo so với chuẩn, ghi sai số trung bình và lớn nhất vào
`device_calibrations`. Cụ thể:

### 7.1 Trước giải (phiếu hiệu chuẩn)

| Thiết bị | Chuẩn so sánh | Cách làm |
| --- | --- | --- |
| Điện thoại 240 fps (kiểm chính nó trước) | Bộ đếm LED | ESP32 chạy bộ đếm nhị phân 1 kHz trên 10 LED; quay 10 s, đọc số trên từng khung để biết khoảng cách khung thật và có VFR/nội suy không |
| Cổng hồng ngoại: phần điện tử | Bộ tạo trễ | ESP32 thứ hai điều khiển hai đèn chắn tia với trễ lập trình 1,000 / 4,000 / 6,000 s; sai lệch phải < 1 ms |
| Cổng hồng ngoại: cả hệ thống | Video 240 fps | 30 lượt chạy thật, so thời gian cổng với video (vạch đích, khung thân qua vạch) |
| Radar | Ô tô + video | Ô tô chạy thẳng về phía radar ở tốc độ ổn định 30–60 km/h (xem tốc độ GPS trên điện thoại); 30 cú sút so với video 240 fps có mốc khoảng cách. Nếu có: âm thoa hiệu chuẩn radar |
| Thảm tiếp xúc | Bàn lực hoặc video | 30 lần nhảy đo đồng thời thảm + video 240 fps (hoặc bàn lực) |
| Bàn lực DIY | Tạ | Đặt tạ 20 / 40 / 60 / 80 kg ở giữa và 4 góc, lập đường hiệu chuẩn tuyến tính |
| Thảm bật xa + ảnh | Thước thép | 30 điểm gót đánh dấu sẵn, so toạ độ máy đọc với thước |
| Sonar chiều cao | Thước đo chuẩn | 30 người, ghi nhiệt độ |
| RFID UHF | Bấm tay + video | 20 lần đi qua vạch ở tốc độ chạy, kiểm tỷ lệ đọc được (mục tiêu ≥ 99%) và lệch thời gian |

Nếu sai số trung bình là lệch đều (luôn chậm 12 ms chẳng hạn), cho phép cấu hình hệ số bù trong phiếu và ghi rõ; nếu sai số dao
động lớn thì sửa bố trí, không bù.

### 7.2 Mỗi ngày thi (5 phút, ghi vào nhật ký trạm)

- Đo lại khoảng cách cổng bằng thước thép, kiểm độ cao tia, nivo.
- Chạy thử 3 lượt có quay video, so lệch; lệch quá sai số phiếu thì dừng trạm để sửa.
- Radar: 3 cú sút thử so với video; kiểm áp suất bóng.
- Thảm: 3 lần nhảy thử có video.
- Kiểm pin, đồng bộ giờ, hàng đợi offline trống.

## 8. Thứ tự làm đề xuất

1. Chốt với BTC: kiểu xuất phát sprint, định nghĩa bật cao, cách đo bật xa, vị trí đo tốc độ sút. Ghi vào mô tả nội dung thi.
2. Hỏi danh sách thiết bị câu lạc bộ (đang chờ trong README); thiết bị nào có sẵn thì xếp bậc tích hợp như 3.2 trong
   03-thiet-bi-do.md, phần còn lại làm DIY theo tài liệu này.
3. Làm bộ đếm LED 1 kHz (một buổi) để kiểm các điện thoại 240 fps sẽ dùng.
4. Mua radar có FFT (OPS243 hoặc Pocket Radar) và làm 3 cổng hồng ngoại 2 tia nối dây: hai thiết bị ảnh hưởng điểm nhiều nhất.
5. Thảm bật hoặc Vertec (theo định nghĩa đã chốt), thảm bật xa in vạch.
6. Hiệu chuẩn 30 lượt mỗi thiết bị, nhập phiếu, rồi mới dùng ở giải.
7. RFID UHF cho 2.000 m và LiDAR đường cong tốc độ để sau vòng 1.

## Còn chờ

- [ ] Kiểu xuất phát sprint 30 m (cổng tự kích hay bàn đạp / hiệu lệnh).
- [ ] Định nghĩa bật cao (CMJ tay chống hông / có đánh tay / bật với) khớp với ngưỡng 60 cm.
- [ ] Bật xa đo tới gót sau hay điểm chạm gần nhất bất kỳ (chuẩn là điểm chạm gần vạch nhất).
- [ ] Ngân sách và số bộ cần (1 bộ đi theo 3 khu vực hay 3 bộ chạy song song).
