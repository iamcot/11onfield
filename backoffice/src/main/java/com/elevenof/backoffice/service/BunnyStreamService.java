package com.elevenof.backoffice.service;

import com.elevenof.backoffice.util.BunnyRules;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bunny Stream for highlight videos. The server only creates the video and signs the upload; the browser sends the file
 * straight to Bunny with TUS, so the file never goes through this server. Empty settings = video upload is off.
 */
@Slf4j
@Service
public class BunnyStreamService {

    static final String API_BASE = "https://video.bunnycdn.com";
    static final String TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

    private final RestTemplate http;
    private final String libraryId;
    private final String apiKey;
    private final String cdnHost;

    public BunnyStreamService(RestTemplateBuilder builder,
                              @Value("${app.bunny.library-id:}") String libraryId,
                              @Value("${app.bunny.api-key:}") String apiKey,
                              @Value("${app.bunny.cdn-host:}") String cdnHost) {
        this.http = builder.setConnectTimeout(Duration.ofSeconds(5)).setReadTimeout(Duration.ofSeconds(15)).build();
        this.libraryId = libraryId == null ? "" : libraryId.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.cdnHost = BunnyRules.cleanHost(cdnHost);
    }

    public boolean isEnabled() {
        return !libraryId.isEmpty() && !apiKey.isEmpty() && !cdnHost.isEmpty();
    }

    public String getLibraryId() {
        return libraryId;
    }

    public String thumbnailUrl(String videoId) {
        return BunnyRules.thumbnailUrl(cdnHost, videoId);
    }

    /** Creates the video on Bunny and returns what the browser needs for the TUS upload. */
    public Map<String, Object> createUpload(String title) {
        if (!isEnabled()) throw new IllegalArgumentException("Chưa bật tải video lên");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("AccessKey", apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        JsonNode answer = http.exchange(API_BASE + "/library/" + libraryId + "/videos", HttpMethod.POST,
                new HttpEntity<>(Map.of("title", BunnyRules.cleanTitle(title)), headers), JsonNode.class).getBody();
        String videoId = answer == null ? null : answer.path("guid").asText(null);
        if (videoId == null || videoId.isBlank()) throw new IllegalStateException("Bunny không trả về mã video");
        long expire = System.currentTimeMillis() / 1000 + BunnyRules.UPLOAD_VALID_SECONDS;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("endpoint", TUS_ENDPOINT);
        out.put("videoId", videoId);
        out.put("libraryId", libraryId);
        out.put("authorizationSignature", BunnyRules.signature(libraryId, apiKey, expire, videoId));
        out.put("authorizationExpire", expire);
        return out;
    }

    /** Deletes a video of our library. Never throws: a failure is only logged. */
    public void deleteVideo(String videoId) {
        if (!isEnabled() || !BunnyRules.isVideoId(videoId)) return;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("AccessKey", apiKey);
            http.exchange(API_BASE + "/library/" + libraryId + "/videos/" + videoId, HttpMethod.DELETE,
                    new HttpEntity<>(headers), String.class);
        } catch (Exception e) {
            log.warn("Bunny video {} not deleted: {}", videoId, e.getMessage());
        }
    }
}
