# API lõi cho các màn giao diện (GĐ1)

Đã có trên nhánh của PR #15. Mọi lỗi nghiệp vụ trả `400 {message}`; thang điểm sai trả thêm `problems: [..]`.

## Cấu hình (1.2)

| Việc | Gọi |
| --- | --- |
| Đọc cấu hình một bài thi (nội dung, thang, nhóm điểm của ngày, đã khoá chưa) | `GET /api/admin/assessment-steps/{stepId}/combine-config` |
| Đổi bài: tính điểm hay không, đối tượng, nhóm điểm | `PUT /api/admin/assessment-steps/{stepId}/combine-config` `{isScored?, audience?: ALL\|OUTFIELD\|GOALKEEPER, topicId?}` |
| Đổi nội dung: chiều tốt, ngưỡng hợp lý, sai số | `PUT /api/admin/assessments/{id}/combine-config` `{direction?: HIGHER\|LOWER, plausibleMin?, plausibleMax?, tolerance?, valueType?}` |
| Lưu thang 5 mức | `PUT /api/admin/competitions/{cid}/stages/{n}/assessment-steps/{stepId}/rating-scale` `{levels:[{level, color: GREY\|RED\|ORANGE\|YELLOW\|GREEN, action: NONE\|FLAG\|ELIMINATE, description?, conditions:[{assessmentId, min?, max?}]}]}` |
| Nhóm điểm của ngày (thay cả danh sách, theo thứ tự) | `GET/PUT /api/admin/assessment-days/{dayId}/topics` `{topics:[{id?, topicKey, name, maxPoints, tieBreakOrder?}]}`; trả `warning` khi tổng khác 100 |

Luật thang: cận `min`, `max` đều tính vào, bỏ trống là không giới hạn. Mỗi nội dung đạt mức cao nhất có khoảng chứa giá trị;
mức bài = mức thấp nhất trong các nội dung. Mức Xám để trống điều kiện = nhận mọi giá trị còn lại. Khi lưu, server báo khoảng
hở, chồng, ngược chiều (ví dụ "Tốc độ sút: 98–100 chưa thuộc mức nào (giữa mức 3 và mức 4)").

## Tablet chấm điểm (1.7)

- `POST /api/admin/field-scoring/save` giữ body cũ, thêm:
  `statuses: {"<assessmentId>_<lượt>": "FAULT"|"DNS"}`, `notes: {key: text}`, `clientUuid` (một mã cho mỗi lần lưu từ hàng đợi offline;
  gửi lại cùng mã thì bỏ qua). Lượt không đổi thì không ghi thêm. Trả `{message, review:[{key, reason}]}`; thí sinh bị bác sĩ loại → `409`.
- `POST /api/admin/field-scoring/preview` `{stepId, scores}` → `{level, color, perAssessment, warnings:[{key, message}]}`, không lưu.
  `warnings` là các lượt ngoài ngưỡng hợp lý.

## Đối soát (1.8)

| Việc | Gọi |
| --- | --- |
| Hàng cần xem của ngày (lọc theo bài) + số lượt theo trạng thái | `GET /api/admin/assessment-days/{dayId}/review?stepId=` → `{items:[{officialId, participantId, fullName, stepTitle, assessmentTitle, attemptNumber, reason, pickedRawId, records:[..]}], counts:{AUTO, REVIEW, RESOLVED, LOCKED}}` |
| Lịch sử một lượt (cả bản ghi đã bị thay) | `GET /api/admin/measurements/history?assessmentId&participantId&attempt` |
| Chốt một lượt | `POST /api/admin/measurements/official/{officialId}/resolve` `{rawId}` hoặc `{value, status?}`, kèm `note` bắt buộc |
| Khoá sổ bài | `POST /api/admin/assessment-steps/{stepId}/lock` (từ chối khi còn lượt cần xem hoặc thiếu lượt) |
| Mở khoá (SUPER_USER) | `POST /api/admin/assessment-steps/{stepId}/unlock` `{reason}` |

`reason`: `SOURCE_MISMATCH` (hai nguồn lệch quá sai số), `IMPLAUSIBLE` (ngoài ngưỡng hợp lý), `AFTER_LOCK` (số tới sau khi khoá),
`AFTER_RESOLVE` (số mới sau khi đã chốt tay). `NEAR_BOUNDARY` là ghi chú trên lượt AUTO, không chặn.

## Điểm (1.9, dùng cho 1.14)

`GET /api/admin/assessment-days/{dayId}/scores?participantId=` → mỗi thí sinh: `total`, `complete`, `topics:[{key, name, maxPoints, points}]`,
`steps:[{stepId, status: SCORED|PENDING|DNS|NOT_APPLICABLE, level, color, action, assessments:[{value, level, attempts}]}]`.
Xếp đủ trước, rồi điểm cao trước.

## Điểm vòng và xếp hạng (1.9, 1.14)

| Việc | Gọi |
| --- | --- |
| Công thức vòng (chưa lưu thì trả mặc định 0.3 × Ngày 1 + GPS & AI 20 + BHL 40 + Tư duy 10, `version: 0`) | `GET /api/admin/stages/{stageId}/formula` → `{version, locked, stored, definition, maxTotal}` |
| Lưu công thức (thành phiên bản mới; đã khoá thì 400) | `PUT /api/admin/stages/{stageId}/formula` `{components:[{key, label, type: DAY\|MANUAL, dayNumber?, weight?, max?}], topicManual:{DUEL: "TACTICAL_7V7"}, classes:[{min, label}], tieBreak:["MIND","DISCIPLINE","FITNESS"]}` |
| Khoá công thức | `POST /api/admin/stages/{stageId}/formula/lock` |
| Tính lại điểm vòng (ghi `score_snapshots`) | `POST /api/admin/stages/{stageId}/round-scores/recompute` → `{count, message}` |
| Bảng xếp hạng (BGK xem được) | `GET /api/admin/competitions/{id}/ranking?stageIds=&goalkeeper=true\|false&region=&roundKey=TOP30` |

Mỗi dòng xếp hạng: `rank`, `tied`, `participantId`, `sbd`, `fullName`, `region`, `positions`, `goalkeeper`, `total`, `complete`,
`classification` (chỉ khi đủ điểm), `topics:{key: points}`, `components:[{key, label, type, raw, points, present}]`, `medicalOut`,
`lowPerformance`, `disciplineCount`, `greenCard`, `votes`, `computedAt`. Thứ tự: đủ điểm trước, điểm cao trước, rồi theo `tieBreak`
(DISCIPLINE = ít vi phạm hơn đứng trước). `tied` là đồng hạng thật sau mọi tiêu chí, giao diện tô để BGK quyết.
Điểm thủ công vượt `max` bị cắt ở `max`. Trang thí sinh không gọi API này (không hiện thứ hạng).

## Chọn Top 30 (1.15)

| Việc | Gọi |
| --- | --- |
| Phiếu của tôi; admin thấy thêm số phiếu từng người | `GET /api/admin/competitions/{id}/selection/{roundKey}/votes` → `{mine:[..], limit:30, counts?:{pid: n}, judges?}` |
| Bỏ phiếu (thay cả danh sách, tối đa 30; đã chốt thì 409) | `PUT .../selection/{roundKey}/votes` `{participantIds:[..]}` |
| Đọc quyết định mới nhất (`{}` khi chưa có) | `GET .../selection/{roundKey}/decision` |
| Chốt (SUPER_USER) | `POST .../selection/{roundKey}/decision?stageIds=` `{participantIds:[..], notes:{"<pid>": "lý do"}}` |

Khi chốt: chọn người hạng > 30 (trừ người có Green Card) hoặc bỏ người trong top 30 đã đủ điểm thì phải có `notes` cho người đó,
thiếu thì 400 `{message, needNote:[pid]}`. Người có Green Card bắt buộc nằm trong danh sách. `roundKey = TOP30` phải đúng 30 người,
chỉ chốt một lần (lần hai 409), và chuyển trạng thái thí sinh sang `SELECTED_TOP30` kèm thông báo như trang `tuyen-chon` cũ.
Vòng khác (ví dụ danh sách ngắn) chốt lại được, lấy quyết định mới nhất.

## Vai trò (V34)

Vai trò web: Người dùng, Cầu thủ, Huấn luyện viên (COACH), Tuyển trạch viên (SCOUTER), Biên tập viên, Y tế, Admin. Bỏ BGK, Điều phối, Super user
(BGK → SCOUTER và vào hội đồng mọi giải, Điều phối → Người dùng, Super user → Admin).

Hội đồng tuyển trạch theo giải: admin gán tài khoản COACH/SCOUTER làm **HLV** hoặc **TTV** (`GET/PUT /api/admin/competitions/{id}/panel`,
`GET .../panel/candidates?q=`). Thành viên nhận quyền `ROLE_HLV` / `ROLE_TTV`, token có claim `panel`; `/api/admin/me` trả `role: HLV|TTV`.

| Việc | Ai |
| --- | --- |
| Check-in, chấm tại trạm, ghi nhận, kỷ luật, không thi | HLV, TTV (admin) |
| Điểm BHL | HLV (admin) |
| Điểm 7v7, tư duy, GPS | HLV, TTV (admin) |
| Bỏ phiếu Top 30 | HLV, TTV của giải đó |
| Xem số phiếu | HLV, admin |
| Chốt Top 30 | HLV của giải đó |
| Giữ Green Card | HLV của giải, admin gán |
| Cờ y tế | Y tế (admin) |
| Cấu hình, đối soát, khoá/mở khoá, tài khoản | Admin |
