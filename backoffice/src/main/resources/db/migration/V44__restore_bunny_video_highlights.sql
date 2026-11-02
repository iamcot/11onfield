-- Saving a player in the admin used to re-create every highlight as a link, so an uploaded Bunny video lost its
-- kind and video id and showed as "other". Its url is still Bunny's player page, which carries the video id.
UPDATE player_highlights
SET kind = 'VIDEO',
    platform = 'bunny',
    video_id = SUBSTRING_INDEX(url, '/', -1)
WHERE kind <> 'VIDEO'
  AND url REGEXP '^https://iframe\\.mediadelivery\\.net/play/[0-9]+/[0-9a-fA-F-]{16,64}$';
