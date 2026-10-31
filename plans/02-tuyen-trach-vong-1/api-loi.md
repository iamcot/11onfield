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
Xếp đủ trước, rồi điểm cao trước. Chưa có điểm vòng 30/20/40/10 và snapshot (V31).
