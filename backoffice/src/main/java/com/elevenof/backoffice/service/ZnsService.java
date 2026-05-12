package com.elevenof.backoffice.service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.elevenof.backoffice.dto.zns.ZnsTokenData;
import com.elevenof.backoffice.dto.zns.ZnsTokenResponse;
import com.elevenof.backoffice.model.Configuration;
import com.elevenof.backoffice.repository.ConfigurationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ZnsService {
    private final ConfigurationRepository configurationRepository;
    private final RestTemplate restTemplate;

    @Value("${zalo.zns.appId}")
    private String appId;

    @Value("${zalo.zns.appSecret}")
    private String appSecret;

    @Value("${zalo.zns.redirectUri}")
    private String redirectUri;

    @Value("${zalo.zns.codeChallenge}")
    private String codeChallenge;

    @Value("${zalo.zns.codeVerifier}")
    private String codeVerifier;

    @Value("${zalo.zns.otpTemplateId}")
    private String otpTemplateId;

    @Value("${zalo.zns.testMode:false}")
    private boolean testMode;

    private static final String TOKEN_CONFIG_KEY = "ZNS_TOKEN";
    private static final String OAUTH_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
    private static final String OAUTH_AUTHORIZE_URL = "https://oauth.zaloapp.com/v4/oa/permission";
    private static final String ZNS_SEND_URL = "https://business.openapi.zalo.me/message/template";

    // Generate OAuth authorization URL
    public String generateAuthUrl() {
        var url = String.format("%s?app_id=%s&redirect_uri=%s&code_challenge=%s&state=%s",
                OAUTH_AUTHORIZE_URL, appId, redirectUri, codeChallenge, codeVerifier);
        log.info("Generated ZNS OAuth authorization URL: {}", url);
        return url;
    }

    // Exchange authorization code for tokens
    public ZnsTokenResponse exchangeCodeForToken(String code) throws Exception {
        log.debug("Exchanging authorization code for token, code: {}", code);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("secret_key", appSecret);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("app_id", appId);
        params.add("grant_type", "authorization_code");
        params.add("code_verifier", codeVerifier);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        log.debug("Sending request to ZNS token endpoint: {}", OAUTH_TOKEN_URL);
        ResponseEntity<ZnsTokenResponse> response = restTemplate.postForEntity(
                OAUTH_TOKEN_URL, request, ZnsTokenResponse.class);

        log.debug("ZNS token exchange response - Status: {}, Headers: {}",
                response.getStatusCode(), response.getHeaders());
        log.debug("ZNS token exchange response body: {}", response.getBody());

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            ZnsTokenResponse body = response.getBody();
            log.info(
                    "Successfully exchanged code for token - Access Token: {}..., Refresh Token: {}..., Expires In: {}s",
                    body.getAccessToken() != null
                            ? body.getAccessToken().substring(0, Math.min(10, body.getAccessToken().length()))
                            : "null",
                    body.getRefreshToken() != null
                            ? body.getRefreshToken().substring(0, Math.min(10, body.getRefreshToken().length()))
                            : "null",
                    body.getExpiresIn());
            return body;
        }

        log.error("Failed to exchange code for token - Status: {}, Body: {}",
                response.getStatusCode(), response.getBody());
        throw new RuntimeException("Failed to exchange code for token");
    }

    // Refresh access token
    public ZnsTokenResponse refreshAccessToken(String refreshToken) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("secret_key", appSecret);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("refresh_token", refreshToken);
        params.add("app_id", appId);
        params.add("grant_type", "refresh_token");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<ZnsTokenResponse> response = restTemplate.postForEntity(
                OAUTH_TOKEN_URL, request, ZnsTokenResponse.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            log.info("Successfully refreshed access token");
            return response.getBody();
        }

        throw new RuntimeException("Failed to refresh access token");
    }

    // Get current valid token (auto-refresh if expired)
    private String getValidAccessToken() throws Exception {
        Optional<Configuration> configOpt = configurationRepository.findByKey(TOKEN_CONFIG_KEY);
        if (configOpt.isEmpty()) {
            throw new IllegalStateException("ZNS token not configured");
        }

        ZnsTokenData tokenData = ZnsTokenData.fromJson(configOpt.get().getValue());
        long currentTime = System.currentTimeMillis() / 1000;

        // Note: Access token expires in 25 hours (90000 seconds)
        // Refresh token expires in 3 months but is single-use
        if (currentTime >= tokenData.getExpiresAt()) {
            // Token expired, refresh it
            log.info("Access token expired, refreshing...");
            ZnsTokenResponse newToken = refreshAccessToken(tokenData.getRefreshToken());
            saveToken(newToken);
            return newToken.getAccessToken();
        }

        return tokenData.getAccessToken();
    }

    // Save token to database
    public void saveToken(ZnsTokenResponse tokenResponse) throws Exception {
        // Access token expires in 25 hours (90000 seconds)
        long expiresAt = (System.currentTimeMillis() / 1000) + Long.parseLong(tokenResponse.getExpiresIn());
        ZnsTokenData tokenData = new ZnsTokenData(
                tokenResponse.getAccessToken(),
                tokenResponse.getRefreshToken(),
                expiresAt);

        Configuration config = configurationRepository.findByKey(TOKEN_CONFIG_KEY)
                .orElse(new Configuration());
        config.setKey(TOKEN_CONFIG_KEY);
        config.setValue(tokenData.toJson());
        config.setDescription("Zalo ZNS OAuth tokens (access token: 25h, refresh token: 3 months single-use)");
        configurationRepository.save(config);

        log.info("ZNS token saved successfully");
    }

    // Send ZNS message
    public void sendOtp(String phone, String otpCode) throws Exception {
        String accessToken = getValidAccessToken();

        // Normalize phone: 0123456789 -> 84123456789
        String normalizedPhone = phone.replaceFirst("^0", "84");

        Map<String, Object> request = new HashMap<>();
        request.put("phone", normalizedPhone);
        request.put("template_id", otpTemplateId);
        request.put("template_data", Map.of("otp", otpCode));
        request.put("tracking_id", UUID.randomUUID().toString());

        // Add mode parameter if in test mode
        if (testMode) {
            request.put("mode", "development");
            log.debug("ZNS test mode enabled - adding mode=development parameter");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("access_token", accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            log.debug("Sending ZNS OTP request: {}", request);
            ResponseEntity<Map> response = restTemplate.postForEntity(ZNS_SEND_URL, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                log.debug("ZNS send response: {}", body);

                // Check error field in response body
                Object errorObj = body.get("error");
                int errorCode = errorObj instanceof Number ? ((Number) errorObj).intValue() : -1;

                if (errorCode == 0) {
                    // Success
                    log.info("ZNS OTP sent successfully to phone: {} (testMode: {})", phone, testMode);
                    if (body.containsKey("data")) {
                        log.debug("ZNS response data: {}", body.get("data"));
                    }
                } else {
                    // Error response from ZNS API
                    String errorMessage = body.getOrDefault("message", "Unknown error").toString();
                    log.error("ZNS API error - Code: {}, Message: {}, Full response: {}",
                            errorCode, errorMessage, body);
                    throw new RuntimeException("Failed to send ZNS message");
                }
            } else {
                log.error("Failed to send ZNS message - HTTP status: {}, response: {}",
                        response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to send ZNS message");
            }
        } catch (Exception e) {
            if (e instanceof RuntimeException && e.getMessage().equals("Failed to send ZNS message")) {
                // Re-throw our custom exception as-is
                throw e;
            }
            log.error("Error sending ZNS message to {}: {}", phone, e.getMessage(), e);
            throw new RuntimeException("Failed to send ZNS message");
        }
    }

    // Get token info for admin display
    public Map<String, String> getTokenInfo() throws Exception {
        Optional<Configuration> configOpt = configurationRepository.findByKey(TOKEN_CONFIG_KEY);
        if (configOpt.isEmpty()) {
            return Map.of("status", "NOT_CONFIGURED");
        }

        ZnsTokenData tokenData = ZnsTokenData.fromJson(configOpt.get().getValue());
        long currentTime = System.currentTimeMillis() / 1000;
        boolean isExpired = currentTime >= tokenData.getExpiresAt();

        return Map.of(
                "status", isExpired ? "EXPIRED" : "ACTIVE",
                "accessTokenPreview",
                tokenData.getAccessToken().substring(0, Math.min(6, tokenData.getAccessToken().length())),
                "refreshTokenPreview",
                tokenData.getRefreshToken().substring(0, Math.min(6, tokenData.getRefreshToken().length())),
                "expiresAt", new Date(tokenData.getExpiresAt() * 1000).toString());
    }
}
