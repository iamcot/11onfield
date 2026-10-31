package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.Competition;
import com.elevenof.backoffice.model.CompetitionNews;
import com.elevenof.backoffice.model.CompetitionSponsor;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.NewsStatus;
import com.elevenof.backoffice.model.Province;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.CompetitionNewsRepository;
import com.elevenof.backoffice.repository.CompetitionRepository;
import com.elevenof.backoffice.repository.CompetitionSponsorRepository;
import com.elevenof.backoffice.repository.EventRepository;
import com.elevenof.backoffice.repository.ProvinceRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.BackgroundRemovalService;
import com.elevenof.backoffice.service.EventService;
import com.elevenof.backoffice.service.S3Service;
import com.elevenof.backoffice.specification.EventSpecification;
import com.elevenof.backoffice.util.ByteArrayMultipartFile;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Admin JSON API: events, competition news, sponsors and image uploads (phase 1). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
public class AdminContentApiController {

    private final EventRepository eventRepository;
    private final EventService eventService;
    private final ProvinceRepository provinceRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionNewsRepository newsRepository;
    private final CompetitionSponsorRepository sponsorRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final BackgroundRemovalService backgroundRemovalService;

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    // ==================== LOOKUPS ====================

    @GetMapping("/provinces")
    public List<Map<String, Object>> provinces() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Province p : provinceRepository.findAll()) out.add(Map.of("id", p.getId(), "name", p.getName()));
        return out;
    }

    // ==================== UPLOADS ====================

    /**
     * Uploads one image to S3 and returns its public URL. type = event | news | sponsor | avatar | fullbody.
     * removeBackground (avatar and fullbody only) cuts the player out first, like the upload on the profile page.
     */
    @PostMapping(value = "/uploads", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam String type, @RequestParam("file") MultipartFile file,
                                                      @RequestParam(defaultValue = "false") boolean removeBackground) {
        if (file == null || file.isEmpty()) return error(HttpStatus.BAD_REQUEST, "Chưa chọn file");
        if (!s3Service.isValidImageFile(file)) return error(HttpStatus.BAD_REQUEST, "File ảnh không hợp lệ");
        try {
            if (removeBackground && (type.equals("avatar") || type.equals("fullbody"))) {
                file = new ByteArrayMultipartFile(backgroundRemovalService.removeBackgroundWithFallback(file.getBytes()), type + ".png", "image/png");
            }
            String url = switch (type) {
                case "event" -> s3Service.uploadEventImage(file, 0L);
                case "news" -> s3Service.uploadNewsImage(file, 0L);
                case "sponsor" -> s3Service.uploadSponsorImage(file, 0L);
                case "avatar", "fullbody" -> s3Service.uploadAvatar(file, 0L);
                default -> null;
            };
            if (url == null) return error(HttpStatus.BAD_REQUEST, "Loại ảnh không hợp lệ");
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi upload ảnh: " + e.getMessage());
        }
    }

    // ==================== EVENTS ====================

    public record EventRequest(String title, String picture, String shortContent, String content,
                               String startDate, String startTime, String endDate, String endTime,
                               String location, Long provinceId, String status) {}

    private Map<String, Object> eventJson(Event e, boolean full) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("title", e.getTitle());
        m.put("picture", e.getPicture());
        m.put("startDate", e.getStartDate());
        m.put("startTime", e.getStartTime());
        m.put("endDate", e.getEndDate());
        m.put("endTime", e.getEndTime());
        m.put("location", e.getLocation());
        m.put("provinceId", e.getProvince() != null ? e.getProvince().getId() : null);
        m.put("provinceName", e.getProvince() != null ? e.getProvince().getName() : null);
        m.put("status", e.getStatus().name());
        if (full) {
            m.put("shortContent", e.getShortContent());
            m.put("content", e.getContent());
        } else {
            m.put("participantCount", eventService.getParticipantCount(e.getId()));
        }
        return m;
    }

    @GetMapping("/events")
    public Map<String, Object> events(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size,
                                      @RequestParam(required = false) String search,
                                      @RequestParam(required = false) String status,
                                      @RequestParam(required = false) Long provinceId) {
        Event.EventStatus st = null;
        if (status != null && !status.isEmpty()) {
            try { st = Event.EventStatus.valueOf(status); } catch (IllegalArgumentException ignored) { }
        }
        Page<Event> p = eventRepository.findAll(EventSpecification.withFilters(search, st, provinceId),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startDate")));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", p.getContent().stream().map(e -> eventJson(e, false)).toList());
        out.put("page", page);
        out.put("totalPages", p.getTotalPages());
        out.put("totalItems", p.getTotalElements());
        return out;
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<?> event(@PathVariable Long id) {
        return eventRepository.findById(id).<ResponseEntity<?>>map(e -> ResponseEntity.ok(eventJson(e, true)))
                .orElseGet(() -> error(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
    }

    private void applyEvent(Event e, EventRequest r) {
        e.setTitle(r.title());
        e.setPicture(blankToNull(r.picture()));
        e.setShortContent(r.shortContent());
        e.setContent(r.content());
        e.setStartDate(LocalDate.parse(r.startDate()));
        e.setStartTime(blankToNull(r.startTime()) != null ? LocalTime.parse(r.startTime()) : null);
        e.setEndDate(LocalDate.parse(r.endDate()));
        e.setEndTime(blankToNull(r.endTime()) != null ? LocalTime.parse(r.endTime()) : null);
        e.setLocation(r.location());
        e.setProvince(r.provinceId() != null ? provinceRepository.findById(r.provinceId()).orElseThrow() : null);
        e.setStatus(Event.EventStatus.valueOf(r.status()));
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody EventRequest r) {
        try {
            Event e = new Event();
            applyEvent(e, r);
            return ResponseEntity.status(HttpStatus.CREATED).body(eventJson(eventRepository.save(e), true));
        } catch (Exception ex) {
            return error(HttpStatus.BAD_REQUEST, "Dữ liệu sự kiện không hợp lệ: " + ex.getMessage());
        }
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody EventRequest r) {
        Event e = eventRepository.findById(id).orElse(null);
        if (e == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện");
        String oldPicture = e.getPicture();
        try {
            applyEvent(e, r);
        } catch (Exception ex) {
            return error(HttpStatus.BAD_REQUEST, "Dữ liệu sự kiện không hợp lệ: " + ex.getMessage());
        }
        eventRepository.save(e);
        if (oldPicture != null && !oldPicture.isEmpty() && !oldPicture.equals(e.getPicture())) {
            try { s3Service.deleteEventImage(oldPicture); } catch (Exception ignored) { }
        }
        return ResponseEntity.ok(eventJson(e, true));
    }

    /** Soft delete, like the old admin: status becomes DELETED. */
    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        Event e = eventRepository.findById(id).orElse(null);
        if (e == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện");
        e.setStatus(Event.EventStatus.DELETED);
        eventRepository.save(e);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/events/{id}/activate")
    public ResponseEntity<?> activateEvent(@PathVariable Long id) {
        Event e = eventRepository.findById(id).orElse(null);
        if (e == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện");
        e.setStatus(Event.EventStatus.PLAN);
        eventRepository.save(e);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // ==================== COMPETITION NEWS ====================

    public record NewsRequest(Long competitionId, String title, String shortContent, String content,
                              String authorByline, String thumbnail, Boolean isFeatured, String status) {}

    private Map<String, Object> newsJson(CompetitionNews n, boolean full) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("competitionId", n.getCompetition().getId());
        m.put("title", n.getTitle());
        m.put("shortContent", n.getShortContent());
        m.put("authorByline", n.getAuthorByline());
        m.put("thumbnail", n.getThumbnail());
        m.put("isFeatured", Boolean.TRUE.equals(n.getIsFeatured()));
        m.put("status", n.getStatus().name());
        m.put("publishedAt", n.getPublishedAt());
        m.put("createdAt", n.getCreatedAt());
        if (full) m.put("content", n.getContent());
        return m;
    }

    @GetMapping("/competitions/{id}/news")
    public List<Map<String, Object>> newsList(@PathVariable Long id) {
        return newsRepository.findByCompetitionIdOrderByCreatedAtDesc(id).stream().map(n -> newsJson(n, false)).toList();
    }

    @GetMapping("/news/{newsId}")
    public ResponseEntity<?> news(@PathVariable Long newsId) {
        return newsRepository.findById(newsId).<ResponseEntity<?>>map(n -> ResponseEntity.ok(newsJson(n, true)))
                .orElseGet(() -> error(HttpStatus.NOT_FOUND, "Không tìm thấy tin tức"));
    }

    private void applyNews(CompetitionNews n, NewsRequest r) {
        n.setCompetition(competitionRepository.findById(r.competitionId()).orElseThrow());
        n.setTitle(r.title());
        n.setShortContent(r.shortContent());
        n.setContent(r.content() != null ? r.content() : "");
        n.setAuthorByline(blankToNull(r.authorByline()));
        n.setThumbnail(blankToNull(r.thumbnail()));
        n.setIsFeatured(Boolean.TRUE.equals(r.isFeatured()));
        NewsStatus st = NewsStatus.valueOf(r.status() == null ? "DRAFT" : r.status());
        if (st == NewsStatus.PUBLISHED && n.getPublishedAt() == null) n.setPublishedAt(LocalDateTime.now());
        n.setStatus(st);
    }

    @PostMapping("/news")
    public ResponseEntity<?> createNews(@RequestBody NewsRequest r, Authentication auth) {
        try {
            CompetitionNews n = new CompetitionNews();
            applyNews(n, r);
            User author = userRepository.findByUserid(auth.getName()).orElse(null);
            n.setAuthor(author);
            return ResponseEntity.status(HttpStatus.CREATED).body(newsJson(newsRepository.save(n), true));
        } catch (Exception ex) {
            return error(HttpStatus.BAD_REQUEST, "Dữ liệu tin tức không hợp lệ: " + ex.getMessage());
        }
    }

    @PutMapping("/news/{newsId}")
    public ResponseEntity<?> updateNews(@PathVariable Long newsId, @RequestBody NewsRequest r) {
        CompetitionNews n = newsRepository.findById(newsId).orElse(null);
        if (n == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tin tức");
        String old = n.getThumbnail();
        try {
            applyNews(n, r);
        } catch (Exception ex) {
            return error(HttpStatus.BAD_REQUEST, "Dữ liệu tin tức không hợp lệ: " + ex.getMessage());
        }
        newsRepository.save(n);
        if (old != null && !old.isBlank() && !old.equals(n.getThumbnail())) {
            try { s3Service.deleteEventImage(old); } catch (Exception ignored) { }
        }
        return ResponseEntity.ok(newsJson(n, true));
    }

    @PostMapping("/news/{newsId}/publish")
    public ResponseEntity<?> publishNews(@PathVariable Long newsId) {
        CompetitionNews n = newsRepository.findById(newsId).orElse(null);
        if (n == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tin tức");
        n.setStatus(NewsStatus.PUBLISHED);
        if (n.getPublishedAt() == null) n.setPublishedAt(LocalDateTime.now());
        newsRepository.save(n);
        return ResponseEntity.ok(newsJson(n, false));
    }

    /** The old admin's "delete" only moves the article back to DRAFT. */
    @PostMapping("/news/{newsId}/unpublish")
    public ResponseEntity<?> unpublishNews(@PathVariable Long newsId) {
        CompetitionNews n = newsRepository.findById(newsId).orElse(null);
        if (n == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tin tức");
        n.setStatus(NewsStatus.DRAFT);
        n.setPublishedAt(null);
        newsRepository.save(n);
        return ResponseEntity.ok(newsJson(n, false));
    }

    @PostMapping("/news/{newsId}/toggle-featured")
    public ResponseEntity<?> toggleFeatured(@PathVariable Long newsId) {
        CompetitionNews n = newsRepository.findById(newsId).orElse(null);
        if (n == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy tin tức");
        n.setIsFeatured(!Boolean.TRUE.equals(n.getIsFeatured()));
        newsRepository.save(n);
        return ResponseEntity.ok(newsJson(n, false));
    }

    // ==================== SPONSORS ====================

    public record SponsorRequest(String name, String websiteUrl, String logoUrl, String bannerImageUrl,
                                 String adPosition, Integer displayOrder, Boolean isActive) {}

    private Map<String, Object> sponsorJson(CompetitionSponsor s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("competitionId", s.getCompetition().getId());
        m.put("name", s.getName());
        m.put("websiteUrl", s.getWebsiteUrl());
        m.put("logoUrl", s.getLogoUrl());
        m.put("bannerImageUrl", s.getBannerImageUrl());
        m.put("adPosition", s.getAdPosition());
        m.put("displayOrder", s.getDisplayOrder());
        m.put("isActive", Boolean.TRUE.equals(s.getIsActive()));
        return m;
    }

    private void applySponsor(CompetitionSponsor s, SponsorRequest r) {
        s.setName(r.name());
        s.setWebsiteUrl(blankToNull(r.websiteUrl()));
        s.setLogoUrl(blankToNull(r.logoUrl()));
        s.setBannerImageUrl(blankToNull(r.bannerImageUrl()));
        s.setAdPosition(blankToNull(r.adPosition()));
        s.setDisplayOrder(r.displayOrder() != null ? r.displayOrder() : 0);
        s.setIsActive(r.isActive() == null || r.isActive());
    }

    @GetMapping("/competitions/{id}/sponsors")
    public List<Map<String, Object>> sponsors(@PathVariable Long id) {
        return sponsorRepository.findByCompetitionIdOrderByDisplayOrderAsc(id).stream().map(this::sponsorJson).toList();
    }

    @GetMapping("/sponsors/{sId}")
    public ResponseEntity<?> sponsor(@PathVariable Long sId) {
        return sponsorRepository.findById(sId).<ResponseEntity<?>>map(s -> ResponseEntity.ok(sponsorJson(s)))
                .orElseGet(() -> error(HttpStatus.NOT_FOUND, "Không tìm thấy nhà tài trợ"));
    }

    @PostMapping("/competitions/{id}/sponsors")
    public ResponseEntity<?> createSponsor(@PathVariable Long id, @RequestBody SponsorRequest r) {
        Competition c = competitionRepository.findById(id).orElse(null);
        if (c == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy giải đấu");
        CompetitionSponsor s = new CompetitionSponsor();
        s.setCompetition(c);
        applySponsor(s, r);
        return ResponseEntity.status(HttpStatus.CREATED).body(sponsorJson(sponsorRepository.save(s)));
    }

    @PutMapping("/sponsors/{sId}")
    public ResponseEntity<?> updateSponsor(@PathVariable Long sId, @RequestBody SponsorRequest r) {
        CompetitionSponsor s = sponsorRepository.findById(sId).orElse(null);
        if (s == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy nhà tài trợ");
        String oldLogo = s.getLogoUrl();
        String oldBanner = s.getBannerImageUrl();
        applySponsor(s, r);
        sponsorRepository.save(s);
        for (String old : new String[]{oldLogo, oldBanner}) {
            if (old != null && !old.isBlank() && !old.equals(s.getLogoUrl()) && !old.equals(s.getBannerImageUrl())) {
                try { s3Service.deleteEventImage(old); } catch (Exception ignored) { }
            }
        }
        return ResponseEntity.ok(sponsorJson(s));
    }

    @PostMapping("/sponsors/{sId}/toggle")
    public ResponseEntity<?> toggleSponsor(@PathVariable Long sId) {
        CompetitionSponsor s = sponsorRepository.findById(sId).orElse(null);
        if (s == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy nhà tài trợ");
        s.setIsActive(!Boolean.TRUE.equals(s.getIsActive()));
        sponsorRepository.save(s);
        return ResponseEntity.ok(sponsorJson(s));
    }

    @DeleteMapping("/sponsors/{sId}")
    public ResponseEntity<?> deleteSponsor(@PathVariable Long sId) {
        CompetitionSponsor s = sponsorRepository.findById(sId).orElse(null);
        if (s == null) return error(HttpStatus.NOT_FOUND, "Không tìm thấy nhà tài trợ");
        for (String url : new String[]{s.getLogoUrl(), s.getBannerImageUrl()}) {
            try { if (url != null) s3Service.deleteEventImage(url); } catch (Exception ignored) { }
        }
        sponsorRepository.delete(s);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
