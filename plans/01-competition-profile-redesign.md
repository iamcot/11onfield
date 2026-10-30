# 01. Redesign of the competition page and the player profile

Started 2026-10-30. Mockup (approved, v2): https://claude.ai/artifact/RavQ69zKiPdtpg6b6osNP4

## Goal

The competition page (`/competitions/[id]`) and the player profile (`/profile/[userid]`) should feel like a game,
not a Facebook clone: the landing stadium backdrop, player cards in the register style, and a 2.5D "stage" that shows a
player's full-body photo with orbiting stats.

## Fixed decisions

- Background: the landing `StadiumBackdrop` (`.of-bg`, beams). Fireflies can be switched off (remembered per browser).
- 60 fps on a phone: only `transform` and `opacity` move; particles are a sprite canvas; every loop stops when the stage
  is off screen (`IntersectionObserver`) or the tab is hidden; no `backdrop-filter` and no beam animation on touch devices.
- Season label is never hard coded: the page reads the competition itself (same rule as the login page, PR #9).

### Competition page

- Hero: name, status, region, countdown to the next round, a horizontal round rail with buttons at both ends. The open
  round sits in the 2nd slot unless it is round 1; on a phone the previous round peeks in.
- Tabs: **Cầu thủ** and **Tin tức** (no "Lịch thi").
- Players: views **Danh sách** (default) and **Thẻ** (register `PlayerCard` style). A third view **Đội hình 11**
  (4-3-3) appears only when the final round "11 ra sân" is open, and is then the default.
- News: featured post, then a grid of 12 per page (picture on top, text below) with pagination; the article page reuses
  the same backdrop.
- Clicking a player opens a drawer with the 3D stage (full-body photo or a drawn figure), orbiting stat chips, rotating
  floor rings, drag to rotate, a hexagon radar against the position average, bars, prev / next, "Xem hồ sơ đầy đủ",
  "Theo dõi". With no pro (council) stats the radar starts on the profile hex (FIT EXP SKL PRF ACH HLT); pressing
  "Chuyên môn" says "Chưa có chỉ số chuyên môn".

### Profile page

- Same stage as the drawer. Avatar with the background removed next to the name.
- Upload guide for the avatar **and** the full-body photo: white background or an already cut-out PNG, face and
  shoulders (avatar) / head to feet (full body), jersey if possible. Both go through the existing Lambda background removal.
- No full-body photo: drawn figure + "Tải ảnh toàn thân" (owner only).
- Owner: a pencil on each block with info edits that block in place (no global popup).
- The "Highlight" and "Thành tích" buttons scroll to their blocks.
- Highlights: a link (YouTube, TikTok, Facebook…) or a video upload (< 50 MB, vertical 9:16 recommended) sent straight
  from the browser to Bunny Stream with TUS, the same way anylearn does it (server creates the video and signs the upload).
- Items waiting for review (highlights, achievements) are shown faded with "Chờ duyệt"; rejected ones say "Bị từ chối".
- Highlights and achievements can be hidden or deleted, never edited: a change means a new item, reviewed again.

## Backend

- Migration `V27__player_full_body_and_media_visibility.sql`:
  - `players.full_body_photo` (URL of the cut-out PNG).
  - `player_highlights.kind` (link / video), `video_id`, `poster_url`, `hidden`.
  - `player_achievements.hidden`.
  - Numbered after PR #4 (V24 to V26). `out-of-order` is off, so merge PR #4 first or renumber.
- `POST /api/users/me/full-body` (multipart, background removed, S3 folder of avatars).
- `POST /api/users/me/highlights` `{url, title?, date?}` → PENDING link highlight.
- `POST /api/users/me/highlights/video-upload` `{title, size}` → Bunny TUS info (refuses 50 MB and more);
  `POST /api/users/me/highlights/video` `{videoId, title?, date?}` → PENDING video highlight.
- `POST /api/users/me/achievements` `{type, title, description?, date?}` → PENDING.
- `PUT /api/users/me/{highlights|achievements}/{id}/hidden` `{hidden}` and `DELETE` (deleting a Bunny video deletes it on Bunny).
- `GET /api/users/{userid}`: the public sees approved and not hidden items; the owner sees everything with `hidden`.
  Highlights carry `kind`, `posterUrl`, `embedUrl`. The profile also returns `fullBodyPhoto`.
- Admin review stays as it is. A video highlight's `url` is the Bunny player page
  (`https://iframe.mediadelivery.net/play/{libraryId}/{videoId}`), so the admin opens it like any link.
- Env: `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOST` (empty = video upload off, the button is hidden).

## Frontend

- `components/stage/PlayerStage` (2.5D stage), `components/stage/HexRadar`, `components/stage/statModel.ts` (pure: pro vs
  profile stats, position average, OVR).
- `components/competition/*`: hero + round rail, player list / cards / pitch, drawer, news grid with pagination.
- `components/profile/*`: hero, stage, blocks with pencil edit, highlight reel with upload, achievements, guides.
- i18n strings for vi / en / es / ko.

## Deferred: leaderboard ("Bảng xếp hạng")

The tab stays switched off. Idea kept for later: a final score = council 50% + measured data 30% + audience vote 20%,
a gold cut line under the places that go to the next round, arrows for movement since the last update, and the viewer's
own line pinned. Needs: council scoring (judges role from the admin plan), measured data import, audience vote with
anti-abuse.

## Data gaps (not built)

- No jersey number and no rank inside a region; the cards show the position code and region instead.
- Position average for the radar is computed from the players of the same competition and position on the page.

## Progress

- [x] Plan
- [x] Backend: migration, full-body upload, per-item highlights / achievements, Bunny upload
- [x] Shared stage, radar, backdrop
- [x] Competition page
- [x] Profile page
- [x] i18n (`src/i18n/messages/players.ts`), tsc, `next build`
- [ ] PR merged (after PR #4, because of V27), Bunny secrets created, check on a phone
- [ ] Later: leaderboard tab (idea above), jersey number, region rank
