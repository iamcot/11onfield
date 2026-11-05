package com.elevenof.backoffice.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Pure rules of the Bunny Stream upload of highlight videos (same scheme as anylearn): the TUS signature, the links of a
 * video and the size limit.
 */
public final class BunnyRules {

    private BunnyRules() {}

    /** How long a signed upload stays valid, in seconds. */
    public static final long UPLOAD_VALID_SECONDS = 6 * 3600;

    /** Highlight videos must be under 50 MB. */
    public static final long MAX_VIDEO_BYTES = 50L * 1024 * 1024;

    /** `sha256(libraryId + apiKey + expirationTime + videoId)` as lowercase hex, the TUS `AuthorizationSignature`. */
    public static String signature(String libraryId, String apiKey, long expire, String videoId) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest((libraryId + apiKey + expire + videoId).getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (byte b : hash) out.append(String.format("%02x", b));
            return out.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** The host as typed: no scheme, no slash ("https://vz-1.b-cdn.net/" gives "vz-1.b-cdn.net"). */
    public static String cleanHost(String host) {
        if (host == null) return "";
        return host.trim().replaceFirst("^https?://", "").replaceAll("/+$", "");
    }

    public static String thumbnailUrl(String cdnHost, String videoId) {
        return "https://" + cleanHost(cdnHost) + "/" + videoId + "/thumbnail.jpg";
    }

    /** Bunny's own player page: what the admin opens to review, and the saved `url` of a video highlight. */
    public static String playUrl(String libraryId, String videoId) {
        return "https://iframe.mediadelivery.net/play/" + libraryId + "/" + videoId;
    }

    /** The player to put in an iframe on the profile. */
    public static String embedUrl(String libraryId, String videoId) {
        return "https://iframe.mediadelivery.net/embed/" + libraryId + "/" + videoId + "?autoplay=false&preload=false&responsive=true";
    }

    /** A Bunny video id is a GUID; anything else is refused before it reaches a URL. */
    public static boolean isVideoId(String id) {
        return id != null && id.matches("[0-9a-fA-F-]{16,64}");
    }

    /** Title for Bunny: trimmed, never empty, at most 200 characters. */
    public static String cleanTitle(String title) {
        String clean = title == null ? "" : title.trim();
        if (clean.isEmpty()) clean = "Highlight";
        return clean.length() > 200 ? clean.substring(0, 200) : clean;
    }

    /** Null when the size is fine, else the message for the player. */
    public static String sizeProblem(Long bytes) {
        if (bytes == null || bytes <= 0) return "Thiếu dung lượng video";
        if (bytes >= MAX_VIDEO_BYTES) return "Video phải nhỏ hơn 50MB";
        return null;
    }
}
