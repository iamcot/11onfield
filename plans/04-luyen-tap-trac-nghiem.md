# 04. Luyện tập trắc nghiệm bóng đá

Kế hoạch đầy đủ (doc): https://claude.ai/artifact/EWeQyQnctwud4pTxtmvRkV

## Đã chốt (02/11/2026)

- AI đi qua **AI gateway của AnyLearn** (`POST /v2/api/open/ai/tool`, PR iamcot/anylearn#36). AnyLearn giữ khóa Anthropic, chọn mô hình theo tính năng và đếm token (trang "Dùng AI (token)", khối "AI cho đối tác", trần token mỗi ngày). Kho câu hỏi, game, bảng xếp hạng nằm ở 11of.
- **Dùng chung khóa của relay ZNS, không thêm env**: 11of gửi `ZNS_RELAY_API_KEY`, địa chỉ gateway là `ZNS_RELAY_URL` đổi đuôi `/zns/otp` thành `/ai/tool` (`AiGatewayClient.gatewayUrl`). Hai biến này trống = nút AI viết câu hỏi báo "chưa cấu hình", phần còn lại vẫn chạy.
- Câu tình huống / chiến thuật / luật có **sơ đồ sân vẽ từ JSON** (`QuizDiagram`), AI sinh kèm câu hỏi; ảnh tải lên khi cần; clip để sau.
- Kho `practice` và kho `exam` tách nhau: câu `exam` không bao giờ ra ở phần luyện tập.
- Kết quả luyện tập không tự cộng vào điểm vòng.

## Giai đoạn

| # | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | AI gateway bên AnyLearn | Xong (anylearn#36) |
| 1 | Kho câu hỏi (BE): V45, `service/quiz/*`, `/api/admin/quiz/*` | Xong (#29) |
| 2 | Trang `/quan-tri/trac-nghiem`: ma trận, hàng chờ duyệt, sửa, trình sửa sơ đồ, chủ đề, công tắc | Xong (#29) |
| 3 | Game + bảng xếp hạng (BE): V46, `QuizGameService`, `/api/quiz/*` | Xong (#29) |
| 4 | Giao diện cầu thủ: tab "Luyện tập" trong trang giải, vẽ sơ đồ SVG + hoạt cảnh | Xong (#29) |
| 5 | Clip, đề thi chính thức (kho `exam`), dịch câu hỏi | Sau |

## Giai đoạn 1: kho câu hỏi

- Bảng (V45): `quiz_topics` (7 chủ đề mẫu: luật, lịch sử, thể lực, chiến thuật, tâm lý, đọc tình huống, ứng xử; `with_diagram` = AI vẽ sơ đồ cho mọi câu), `quiz_questions` (độ khó 1-5, `pool`, `media_type` none/diagram/image, `diagram`, `status` pending/active/hidden, `verified` 1/0/-1), `quiz_question_reports`, `quiz_gen_runs`.
- AI viết (`QuizBankService.generate`, tối đa 10 câu mỗi lần, 4 câu nếu chủ đề có sơ đồ): feature `11of_quiz_write` → lọc trùng (hash + trùng 80% từ) → xáo đáp án → feature `11of_quiz_verify` làm bài mù → khớp đáp án: chờ duyệt (`verified 1`); khác đáp án: ẩn (`verified -1`) để biên tập xem; AI bỏ qua: chờ duyệt (`verified 0`). Không câu AI nào tự ra cho cầu thủ.
- Câu biên tập nhập tay lưu luôn `active`. Sửa một câu = đã duyệt (`reviewed_by`, `reviewed_at`).
- Luật thuần có test: `QuizBankRules`, `QuizDiagram`.

### API (ADMIN, EDITOR)

| Việc | Gọi |
| --- | --- |
| Ma trận chủ đề × độ khó | `GET /api/admin/quiz/overview?pool=practice&target=30` |
| Chủ đề | `GET /api/admin/quiz/topics`, `POST /api/admin/quiz/topics {label, hint, group, withDiagram, sortOrder, key?}`, `PUT /api/admin/quiz/topics/{key}` |
| AI viết một đợt | `POST /api/admin/quiz/generate {topic, difficulty, count, pool}` → `{requested, returned, invalid, duplicates, saved, verifyFailed, error}` |
| Lịch sử các đợt | `GET /api/admin/quiz/runs?limit=30` |
| Danh sách / hàng chờ duyệt | `GET /api/admin/quiz/questions?status=pending&topic&difficulty&pool&q&page&size` (`status=reported` = có báo lỗi) |
| Thêm tay | `POST /api/admin/quiz/questions {topic, difficulty, pool, body, options[4], correct, explanation, diagram?, mediaUrl?}` |
| Sửa | `PUT /api/admin/quiz/questions/{id}` (trường không gửi giữ nguyên, `diagram: null` xóa sơ đồ) |
| Duyệt / ẩn hàng loạt | `POST /api/admin/quiz/questions/status {ids, status}` |

### Sơ đồ sân (JSON)

Tọa độ 0..100: x từ khung thành đội mình (0) tới khung thành đối thủ (100), đội mình luôn tấn công sang phải; y từ biên trên (0) tới biên dưới (100).

```json
{"players":[{"team":"own","x":35,"y":80,"label":"3","me":true},{"team":"opp","x":45,"y":70,"label":"7"}],
 "ball":{"x":46,"y":70},
 "arrows":[{"kind":"run","from":[45,70],"to":[30,75]}],
 "zones":[{"x":20,"y":60,"w":15,"h":25,"label":"Khoảng trống"}]}
```

Tối đa 22 cầu thủ, 12 mũi tên (`run`, `pass`, `shot`, `dribble`), 6 vùng; nhãn cầu thủ tối đa 3 ký tự; chỉ một cầu thủ `me`.

### Lưu ý vận hành

- AnyLearn chờ AI tối đa 30 giây, nên một đợt chủ đề có sơ đồ tối đa 4 câu (chủ đề khác 10 câu). Đợt lỗi vẫn ghi vào `quiz_gen_runs` kèm lỗi (ví dụ "Đã hết hạn mức AI hôm nay" khi chạm trần token bên AnyLearn).
- Trên production `ZNS_RELAY_URL` nên trỏ thẳng vào AnyLearn trên cùng máy (`http://127.0.0.1:8080/v2/api/open/zns/otp`) để gọi AI không đi vòng qua internet.

## Giai đoạn 2 đến 4 (đã làm)

- **Công tắc**: dòng `configurations` `quiz/enabled` (mặc định 0 = tắt). Tắt thì cầu thủ không thấy tab, API trả 403; ADMIN và EDITOR vẫn thấy tab có nhãn "thử" để chơi thử. Chỉ ADMIN bật/tắt được (tab "Bật tắt & cài đặt"). Các con số khác (`seconds`, `daily_rank_cap`, `stars_per_rank`, `no_repeat_days`, `mock_size`, `mock_minutes`, `board_enabled`) nằm trong một bảng `QuizSettings.FIELDS`.
- **Game (V46)**: `quiz_profiles` (hạng, sao, lượt giữ hạng, chuỗi), `quiz_attempts` (một dòng mỗi câu phát ra; thứ tự đáp án trộn riêng, đáp án đúng chỉ trả về sau khi trả lời), `quiz_board` (sao ròng theo tuần `W2026-45` và tháng `M2026-11`), `quiz_mocks`. 8 hạng Phong trào → Huyền thoại, 5 sao mỗi hạng; đủ sao thì câu đúng kế tiếp lên hạng; hết sao còn 1 lượt giữ hạng rồi mới rớt. Độ khó theo hạng (`QuizGameRules.MIX`). Trả lời đúng dưới 1,5 giây hoặc lúc rời trang bị gắn cờ, không tính BXH. Câu bị 3 người báo lỗi tự ẩn.
- **API cầu thủ**: `GET /api/quiz/status` (công khai), `GET me`, `POST start {mode rank|practice, topic?, difficulty?}`, `POST answer {attemptId, option, away}`, `POST questions/{id}/report`, `POST mock/start`, `POST mock/{id}/submit`, `GET mock/history`, `GET leaderboard?type=week|month|all&competitionId=` (công khai khi bật).
- **FE**: tab "Luyện tập" (`?tab=quiz`) trong `/competitions/[id]`; trang chơi `/competitions/[id]/luyen-tap?mode=rank|practice|mock`; BXH `/competitions/[id]/luyen-tap/bang-xep-hang` (lọc tuần/tháng/mọi lúc, tất cả hoặc thí sinh giải). Sơ đồ `components/quiz/PitchDiagram` dùng chung cho trang chơi và trình sửa (kéo thả). Chữ dịch ở `i18n/messages/quiz.ts`.
- **Đã thử** (02/11/2026) trên MariaDB với bản dump và AI giả: sinh đề + kiểm tra mù (câu lệch tự ẩn), duyệt hàng loạt, bật/tắt, leo 2 hạng rồi rớt, gắn cờ, đề thử 20 câu, BXH theo giải; giao diện quản trị và cầu thủ (điện thoại 390 px) không lỗi console; `next build` qua.
- **Trước khi bật trên production**: deploy anylearn (gateway) và 11of, để AI viết đủ câu ở tab "Tổng quan kho", duyệt, rồi ADMIN bật công tắc.
