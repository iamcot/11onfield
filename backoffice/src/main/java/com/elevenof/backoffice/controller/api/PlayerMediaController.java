package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.exception.FileUploadException;
import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAchievement;
import com.elevenof.backoffice.model.PlayerHighlight;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.PlayerAchievementRepository;
import com.elevenof.backoffice.repository.PlayerHighlightRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.BackgroundRemovalService;
import com.elevenof.backoffice.service.BunnyStreamService;
import com.elevenof.backoffice.service.S3Service;
import com.elevenof.backoffice.util.BunnyRules;
import com.elevenof.backoffice.util.ByteArrayMultipartFile;
import com.elevenof.backoffice.util.PlatformDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The player's own media on the profile page: full-body photo, and highlights / achievements added one by one.
 * Highlights and achievements are never edited: the player hides or deletes one and adds a new one, which waits for the
 * admin's review again (approval stays in the existing admin pages).
 */
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@Slf4j
public class PlayerMediaController {

    private static final long MAX_PHOTO_BYTES = 20L * 1024 * 1024;

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final PlayerHighlightRepository highlightRepository;
    private final PlayerAchievementRepository achievementRepository;
    private final S3Service s3Service;
    private final BackgroundRemovalService backgroundRemovalService;
    private final BunnyStreamService bunny;

    /** Bunny video ids handed out by {@link #startVideoUpload}, so a player can only attach a video they uploaded. */
    private final Map<String, Long> issuedVideos = new ConcurrentHashMap<>();

    private Player currentPlayer(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new org.springframework.security.access.AccessDeniedException("Cần đăng nhập");
        }
        User user = userRepository.findByUserid(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        return playerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cầu thủ"));
    }

    /** What the profile page may offer: video upload only when Bunny is configured. */
    @GetMapping("/media-config")
    public Map<String, Object> mediaConfig() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("videoUpload", bunny.isEnabled());
        out.put("maxVideoBytes", BunnyRules.MAX_VIDEO_BYTES);
        return out;
    }

    // ---- Full-body photo -------------------------------------------------------------------------------------------

    @PostMapping(value = "/full-body", consumes = "multipart/form-data")
    @Transactional
    public Map<String, String> uploadFullBody(Authentication authentication,
                                              @RequestParam("file") MultipartFile file,
                                              @RequestParam(value = "removeBackground", defaultValue = "true") boolean removeBackground) {
        Player player = currentPlayer(authentication);
        if (file == null || file.isEmpty()) throw new FileUploadException("File không được để trống");
        if (!s3Service.isValidAvatarFile(file)) throw new FileUploadException("File không hợp lệ. Chỉ chấp nhận: JPEG, PNG, GIF, WebP");
        if (file.getSize() > MAX_PHOTO_BYTES) throw new FileUploadException("Kích thước file vượt quá 20MB");
        try {
            MultipartFile upload = file;
            if (removeBackground) {
                try {
                    byte[] cut = backgroundRemovalService.removeBackgroundWithFallback(file.getBytes());
                    upload = new ByteArrayMultipartFile(cut, "full-body.png", "image/png");
                } catch (Exception e) {
                    log.warn("Background removal failed for full-body photo of player {}: {}", player.getId(), e.getMessage());
                }
            }
            String old = player.getFullBodyPhoto();
            String url = s3Service.uploadAvatar(upload, player.getId());
            player.setFullBodyPhoto(url);
            playerRepository.save(player);
            if (old != null && !old.isBlank()) s3Service.deleteAvatar(old);
            return Map.of("fullBodyPhoto", url);
        } catch (IOException e) {
            throw new FileUploadException("Upload thất bại: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/full-body")
    @Transactional
    public ResponseEntity<Void> deleteFullBody(Authentication authentication) {
        Player player = currentPlayer(authentication);
        String old = player.getFullBodyPhoto();
        player.setFullBodyPhoto(null);
        playerRepository.save(player);
        if (old != null && !old.isBlank()) s3Service.deleteAvatar(old);
        return ResponseEntity.noContent().build();
    }

    // ---- Highlights ------------------------------------------------------------------------------------------------

    public record LinkHighlightRequest(String url, String title, LocalDate date) {}

    public record VideoUploadRequest(String title, Long size) {}

    public record VideoHighlightRequest(String videoId, String title, LocalDate date) {}

    public record HiddenRequest(Boolean hidden) {}

    @PostMapping("/highlights")
    @Transactional
    public Map<String, Object> addLinkHighlight(Authentication authentication, @RequestBody LinkHighlightRequest request) {
        Player player = currentPlayer(authentication);
        String url = request.url() == null ? "" : request.url().trim();
        if (!url.matches("(?i)^https?://\\S+$") || url.length() > 500) throw new IllegalArgumentException("Link không hợp lệ");
        PlayerHighlight saved = highlightRepository.save(PlayerHighlight.builder()
                .player(player)
                .kind(PlayerHighlight.Kind.LINK)
                .url(url)
                .platform(PlatformDetector.detectPlatform(url))
                .title(cleanTitle(request.title()))
                .highlightDate(request.date())
                .build());
        return Map.of("id", saved.getId());
    }

    /** Creates the video on Bunny and signs the TUS upload; the browser then sends the file straight to Bunny. */
    @PostMapping("/highlights/video-upload")
    public Map<String, Object> startVideoUpload(Authentication authentication, @RequestBody VideoUploadRequest request) {
        Player player = currentPlayer(authentication);
        String problem = BunnyRules.sizeProblem(request.size());
        if (problem != null) throw new IllegalArgumentException(problem);
        Map<String, Object> info = bunny.createUpload(player.getUser().getFullName() + " · " + BunnyRules.cleanTitle(request.title()));
        issuedVideos.put((String) info.get("videoId"), player.getId());
        return info;
    }

    /** Saves the uploaded video as a highlight waiting for review. */
    @PostMapping("/highlights/video")
    @Transactional
    public Map<String, Object> addVideoHighlight(Authentication authentication, @RequestBody VideoHighlightRequest request) {
        Player player = currentPlayer(authentication);
        String videoId = request.videoId();
        if (!BunnyRules.isVideoId(videoId) || !player.getId().equals(issuedVideos.get(videoId))) {
            throw new IllegalArgumentException("Video không hợp lệ, hãy tải lại");
        }
        PlayerHighlight saved = highlightRepository.save(PlayerHighlight.builder()
                .player(player)
                .kind(PlayerHighlight.Kind.VIDEO)
                .videoId(videoId)
                .url(BunnyRules.playUrl(bunny.getLibraryId(), videoId))
                .platform("bunny")
                .posterUrl(bunny.thumbnailUrl(videoId))
                .title(cleanTitle(request.title()))
                .highlightDate(request.date())
                .build());
        issuedVideos.remove(videoId);
        return Map.of("id", saved.getId());
    }

    @PutMapping("/highlights/{id}/hidden")
    @Transactional
    public ResponseEntity<Void> hideHighlight(Authentication authentication, @PathVariable Long id, @RequestBody HiddenRequest request) {
        PlayerHighlight highlight = ownHighlight(authentication, id);
        highlight.setHidden(Boolean.TRUE.equals(request.hidden()));
        highlightRepository.save(highlight);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/highlights/{id}")
    @Transactional
    public ResponseEntity<Void> deleteHighlight(Authentication authentication, @PathVariable Long id) {
        PlayerHighlight highlight = ownHighlight(authentication, id);
        String videoId = highlight.getKind() == PlayerHighlight.Kind.VIDEO ? highlight.getVideoId() : null;
        highlight.getPlayer().getHighlights().remove(highlight);
        highlightRepository.delete(highlight);
        if (videoId != null) bunny.deleteVideo(videoId);
        return ResponseEntity.noContent().build();
    }

    private PlayerHighlight ownHighlight(Authentication authentication, Long id) {
        Player player = currentPlayer(authentication);
        PlayerHighlight highlight = highlightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy highlight"));
        if (!highlight.getPlayer().getId().equals(player.getId())) throw new ResourceNotFoundException("Không tìm thấy highlight");
        return highlight;
    }

    // ---- Achievements ----------------------------------------------------------------------------------------------

    public record AchievementRequest(String type, String title, String description, LocalDate date) {}

    @PostMapping("/achievements")
    @Transactional
    public Map<String, Object> addAchievement(Authentication authentication, @RequestBody AchievementRequest request) {
        Player player = currentPlayer(authentication);
        PlayerAchievement.AchievementType type;
        try {
            type = PlayerAchievement.AchievementType.valueOf(request.type() == null ? "" : request.type().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Loại thành tích không hợp lệ");
        }
        String title = request.title() == null ? "" : request.title().trim();
        if (title.isEmpty()) throw new IllegalArgumentException("Cần nhập tên thành tích");
        if (title.length() > 300) throw new IllegalArgumentException("Tên thành tích tối đa 300 ký tự");
        String description = request.description() == null ? null : request.description().trim();
        if (description != null && description.length() > 2000) throw new IllegalArgumentException("Mô tả tối đa 2000 ký tự");
        PlayerAchievement saved = achievementRepository.save(PlayerAchievement.builder()
                .player(player)
                .type(type)
                .title(title)
                .description(description == null || description.isEmpty() ? null : description)
                .achievementDate(request.date())
                .build());
        return Map.of("id", saved.getId());
    }

    @PutMapping("/achievements/{id}/hidden")
    @Transactional
    public ResponseEntity<Void> hideAchievement(Authentication authentication, @PathVariable Long id, @RequestBody HiddenRequest request) {
        PlayerAchievement achievement = ownAchievement(authentication, id);
        achievement.setHidden(Boolean.TRUE.equals(request.hidden()));
        achievementRepository.save(achievement);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/achievements/{id}")
    @Transactional
    public ResponseEntity<Void> deleteAchievement(Authentication authentication, @PathVariable Long id) {
        PlayerAchievement achievement = ownAchievement(authentication, id);
        achievement.getPlayer().getAchievements().remove(achievement);
        achievementRepository.delete(achievement);
        return ResponseEntity.noContent().build();
    }

    private PlayerAchievement ownAchievement(Authentication authentication, Long id) {
        Player player = currentPlayer(authentication);
        PlayerAchievement achievement = achievementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành tích"));
        if (!achievement.getPlayer().getId().equals(player.getId())) throw new ResourceNotFoundException("Không tìm thấy thành tích");
        return achievement;
    }

    private static String cleanTitle(String title) {
        if (title == null) return null;
        String clean = title.trim();
        if (clean.isEmpty()) return null;
        return clean.length() > 200 ? clean.substring(0, 200) : clean;
    }
}
