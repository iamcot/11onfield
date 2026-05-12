package com.elevenof.backoffice.util;

/**
 * Utility class to detect social media and video platform from URLs
 */
public class PlatformDetector {

    /**
     * Detects the platform from a given URL
     *
     * @param url The URL to analyze
     * @return The platform name (youtube, facebook, instagram, tiktok, vimeo, twitter, other) or null if URL is null/empty
     */
    public static String detectPlatform(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }

        String lowerUrl = url.toLowerCase();

        // Video platforms
        if (lowerUrl.contains("youtube.com") || lowerUrl.contains("youtu.be")) {
            return "youtube";
        }
        if (lowerUrl.contains("vimeo.com")) {
            return "vimeo";
        }

        // Social media platforms
        if (lowerUrl.contains("facebook.com") || lowerUrl.contains("fb.com") || lowerUrl.contains("fb.watch")) {
            return "facebook";
        }
        if (lowerUrl.contains("instagram.com")) {
            return "instagram";
        }
        if (lowerUrl.contains("tiktok.com")) {
            return "tiktok";
        }
        if (lowerUrl.contains("twitter.com") || lowerUrl.contains("x.com")) {
            return "twitter";
        }
        if (lowerUrl.contains("linkedin.com")) {
            return "linkedin";
        }

        return "other";
    }
}
