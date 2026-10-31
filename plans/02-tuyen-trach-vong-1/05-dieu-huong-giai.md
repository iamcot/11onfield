# 05 · Điều hướng giải đấu theo 3 bước

> Trạng thái: đã làm xong bước 1–4 (commit 766b860, ac5c760 và commit sau đó trên nhánh claude/project-thread-nlr5ou).

Mockup đã chốt: [mockup/dieu-huong-giai.html](mockup/dieu-huong-giai.html) (mở bằng trình duyệt, bấm thử được).
Bản online: https://claude.ai/artifact/RESwBj1AWihxjJweMTpwHA

## Mục tiêu

Admin có một cái nhìn tổng quan cho cả giải và đi lại giữa các việc dễ dàng.

- Thanh 3 bước **Chuẩn bị / Ngày thi / Sau khi thi** (cộng cột nhỏ **Nội dung giải**) thay cho hàng tab cũ.
  - Thanh này luôn nằm trên cùng mọi trang của một giải và dính (sticky) khi cuộn.
- Bấm mục nào thì mục đó sáng lên, màn hình của mục hiện ngay bên dưới. Địa chỉ trang đổi theo, nên nút Back của trình duyệt vẫn dùng được.
- Mỗi mục có dấu trạng thái lấy từ dữ liệu thật: ✓ đã xong, ! cần chú ý, ○ chưa làm.
- Mỗi màn hình chỉ có **một** chỗ trong thanh, không lặp link.
- Các trang riêng cho HLV và TTV trên tablet (check-in, chấm điểm, ghi nhận) vẫn giữ như cũ.

## Danh sách mục và đường dẫn

`V` = việc theo vòng: đi theo nút chọn vòng ở góc phải, đường dẫn có `/vong/{n}`.

| Bước | Mục | Đường dẫn mới | Màn hình hiện có dùng lại |
|---|---|---|---|
| Chuẩn bị | Thông tin giải | `/giai-dau/{id}` | `giai-dau/[id]/page.tsx` |
| | Thí sinh và SBD | `/giai-dau/{id}/thi-sinh` | `thi-sinh` (thêm nút In phiếu SBD → `thi-sinh/phieu-sbd`) |
| | Danh sách vòng | `/giai-dau/{id}/vong` | `vong/page.tsx` (bỏ phần kích hoạt ra mục riêng) |
| | Hội đồng tuyển trạch | `/giai-dau/{id}/hoi-dong` | `hoi-dong` |
| | Bài thi và thang điểm `V` | `/giai-dau/{id}/vong/{n}` | `vong/[n]/page.tsx` (bỏ RoundFlow) |
| | Kích hoạt vòng `V` | `/giai-dau/{id}/vong/{n}/kich-hoat` | mới: nút mở / đóng vòng, lấy từ `vong/page.tsx` |
| Ngày thi | Check-in `V` | `/giai-dau/{id}/vong/{n}/check-in` | bọc lại `check-in/page.tsx` thành component nhận `stageId` |
| | Chấm điểm tại trạm `V` | `/giai-dau/{id}/vong/{n}/cham-diem` | bọc lại `cham-diem/page.tsx` (admin xem tiến độ) |
| | Ghi nhận thí sinh `V` | `/giai-dau/{id}/vong/{n}/ghi-nhan` | bọc lại `ghi-nhan/page.tsx` |
| Sau khi thi | Đối soát và khoá sổ `V` | `/giai-dau/{id}/vong/{n}/doi-soat` | `vong/[n]/doi-soat` (gồm luôn "số cần xem") |
| | Điểm chấm tay `V` | `/giai-dau/{id}/vong/{n}/diem-cham-tay` | `vong/[n]/diem-cham-tay` |
| | Kết quả vòng `V` | `/giai-dau/{id}/vong/{n}/ket-qua` | `vong/[n]/ket-qua` (+ `bien-ban`) |
| | Xếp hạng 3 khu vực | `/giai-dau/{id}/xep-hang` | `xep-hang` |
| | Top 30 và Green Card | `/giai-dau/{id}/tuyen-chon` | `tuyen-chon` |
| | Phát hành kết quả | `/giai-dau/{id}/hien-thi` | `hien-thi` |
| Nội dung giải | Tin tức | `/giai-dau/{id}/tin-tuc` | `tin-tuc` |
| | Nhà tài trợ | `/giai-dau/{id}/nha-tai-tro` | `nha-tai-tro` |

Mục bỏ hoặc gộp:
- "Theo dõi số cần xem" gộp vào Đối soát.
- "Hiển thị" đổi tên thành Phát hành kết quả.
- "In phiếu SBD" là nút trong Thí sinh.
- `danh-gia-cuoi` và `thang-diem` đang chỉ redirect, có thể xoá.

## Các bước làm

### 1. Layout chung cho giải (frontend)

- Tạo `app/quan-tri/(app)/giai-dau/[id]/layout.tsx` (client) gồm:
  - tên giải và link "← Danh sách giải đấu";
  - nút chọn vòng: đọc `competitions/{id}/stages`, vòng đang chọn lấy từ `/vong/{n}` trong URL, nếu không có thì là vòng LIVE hoặc vòng sắp tới;
  - component mới `CompetitionFlow` (thanh 3 bước, sticky, theo mockup);
  - `{children}` bên dưới.
- Danh sách mục khai báo một chỗ duy nhất, ví dụ `lib/admin/competition-flow.ts`: id, nhãn, bước, `perRound`, `href(id, n)`, `managerOnly`.
  - Mục đang chọn tính theo `pathname`. Lấy prefix dài nhất khớp, để `vong/{n}/doi-soat` không làm sáng cả "Bài thi".
- Gỡ `CompetitionTabs` và `RoundFlow` khỏi mọi trang (13 file đang dùng).
  - Tiêu đề trang chuyển thành `PageTitle` nhỏ, hoặc dùng tên mục.
  - Tiêu đề mỗi màn hình theo mockup: dòng phụ "Chuẩn bị · Vòng 1" và tên mục.
- Xoá `BackToRound.tsx` và chỗ gọi trong `AdminShell` (không cần nữa).
- Trên điện thoại: thanh 3 bước gập thành 1 cột và không sticky (xem CSS trong mockup).

### 2. API trạng thái các bước (backend)

Thêm `GET /api/admin/competitions/{id}/flow?stage={n}` trong `AdminRoundController` hoặc một controller mới. Endpoint trả `{ steps: { [id]: { state: 'done' | 'warn' | 'todo', meta?: string, warn?: string } } }`.

Quy tắc gợi ý, lấy từ dữ liệu đang có:
- thong-tin: done khi có tên, ngày, địa điểm.
- thi-sinh: done khi có ≥ 1 thí sinh đã duyệt và mọi người đã có SBD. warn khi còn người chưa có SBD. meta là "120 người".
- danh-sach-vong: done khi có ≥ 1 vòng. meta là "2 vòng".
- hoi-dong: warn "chưa có HLV" khi không có thành viên HLV. done khi có ít nhất 1 HLV và 1 TTV.
- bai-thi (theo vòng): warn khi có bài tính điểm nhưng chưa có thang hoặc chưa có nội dung. meta là "2 bài chưa có thang".
- kich-hoat: done khi vòng LIVE hoặc COMPLETED.
- check-in: meta là "x/y". done khi vòng đã đóng check-in.
- cham-diem: meta là số lượt đã đo. todo trước ngày thi.
- doi-soat: warn khi còn lượt "cần xem". done khi đã khoá sổ.
- diem-cham-tay: warn khi đã khoá sổ mà còn mục thiếu điểm. meta là số còn thiếu.
- ket-qua: done khi có ScoreSnapshot của vòng.
- xep-hang: done khi công thức điểm đã khoá.
- top-30: done khi có SelectionDecision TOP30.
- phat-hanh: done khi đã bật hiển thị kết quả.
- tin-tuc, nha-tai-tro: không có trạng thái, chỉ có meta là số lượng.

Phần lớn số liệu đã có sẵn trong các endpoint hiện tại (stages, reconciliation, manual-scores, ranking, decision). Endpoint mới chỉ gom lại cho nhẹ. Frontend gọi lại endpoint này sau mỗi lần lưu (hoặc `mutate`) để dấu cập nhật.

### 3. Màn hình mới hoặc tách ra

- **Kích hoạt vòng:** nút mở / đóng vòng, cộng danh sách những gì còn thiếu (lấy từ `flow`), để admin biết vì sao chưa nên kích hoạt.
- **Check-in, Chấm điểm, Ghi nhận trong giải:**
  - Tách phần thân của 3 trang tablet thành component nhận `stageId` (ví dụ `components/admin/day/CheckInBoard.tsx`).
  - Trang tablet cũ vẫn tự chọn vòng LIVE như bây giờ.
  - Trang mới trong giải truyền `stageId` của vòng đang chọn.
- **Danh sách vòng:** giữ form thêm / sửa vòng. Nút kích hoạt chuyển sang mục Kích hoạt vòng.

### 4. Dọn dẹp và kiểm tra

- Bỏ `?tu=` và `withFrom`. Link cũ từ menu bên trái (Check-in, Chấm điểm) vẫn trỏ trang tablet.
- `npx tsc --noEmit` trong `frontend-app` (không có eslint config, `next lint` sẽ treo).
- Chạy thử bằng Playwright: admin bấm lần lượt từng mục và đổi vòng. Kiểm tra mục đang chọn sáng đúng, không có trang trắng, dấu trạng thái đổi sau khi lưu.
- HLV / TTV: thanh vẫn hiện, nhưng ẩn các mục chỉ admin làm được (Hội đồng, Danh sách vòng, Kích hoạt, Phát hành, Tin tức, Nhà tài trợ).

## Ước lượng

- Bước 1: khoảng nửa ngày (đụng 13 trang, chủ yếu gỡ header).
- Bước 2: khoảng nửa ngày.
- Bước 3: khoảng nửa ngày.
- Bước 4: vài giờ.

Có thể làm theo thứ tự 1 → 2 → 3, mỗi bước một commit. Sau bước 1 giao diện đã dùng được, chỉ chưa có dấu trạng thái.
