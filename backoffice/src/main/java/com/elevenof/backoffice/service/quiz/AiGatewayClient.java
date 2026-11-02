package com.elevenof.backoffice.service.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Calls Claude through AnyLearn's AI gateway (`POST /v2/api/open/ai/tool`). AnyLearn keeps the Anthropic key,
 * picks the model per feature and counts the tokens; we send our own prompt and one tool and get the tool's JSON.
 * Same key and host as the ZNS relay: the address is `ZNS_RELAY_URL` with `/zns/otp` replaced by `/ai/tool`,
 * so no extra environment variable. Empty relay settings = AI off.
 */
@Component
@Slf4j
public class AiGatewayClient {

    public static final String QUIZ_WRITE = "11of_quiz_write";
    public static final String QUIZ_VERIFY = "11of_quiz_verify";

    public record Answer(JsonNode json, int inputTokens, int outputTokens, String model) {}

    /** The gateway answered with an error (no key, over the daily cap, AI failed); the message is for the editor. */
    public static class GatewayException extends RuntimeException {
        public GatewayException(String message) {
            super(message);
        }
    }

    private final RestTemplate restTemplate;
    private final String url;
    private final String apiKey;

    public AiGatewayClient(RestTemplate restTemplate,
                           @Value("${zalo.zns.relayUrl:}") String relayUrl,
                           @Value("${zalo.zns.relayApiKey:}") String relayApiKey) {
        this.restTemplate = restTemplate;
        this.url = gatewayUrl(relayUrl);
        this.apiKey = relayApiKey;
    }

    /** `https://anylearn.vn/v2/api/open/zns/otp` -> `https://anylearn.vn/v2/api/open/ai/tool`; null when it cannot be derived. */
    static String gatewayUrl(String relayUrl) {
        if (relayUrl == null || relayUrl.isBlank()) return null;
        String base = relayUrl.trim().replaceAll("/+$", "");
        if (!base.endsWith("/zns/otp")) return null;
        return base.substring(0, base.length() - "/zns/otp".length()) + "/ai/tool";
    }

    public boolean isConfigured() {
        return url != null && apiKey != null && !apiKey.isBlank();
    }

    public Answer askTool(String feature, String system, String user, int maxTokens, Map<String, Object> tool) {
        if (!isConfigured()) throw new GatewayException("Chưa cấu hình AI (ZNS_RELAY_URL / ZNS_RELAY_API_KEY).");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Api-Key", apiKey);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("feature", feature);
        body.put("system", system);
        body.put("user", user);
        body.put("maxTokens", maxTokens);
        body.put("tool", tool);
        JsonNode res;
        try {
            res = restTemplate.postForObject(url, new HttpEntity<>(body, headers), JsonNode.class);
        } catch (HttpStatusCodeException e) {
            String message = messageOf(e.getResponseBodyAsString());
            log.warn("[AI gateway] {} answered {}: {}", feature, e.getStatusCode().value(), message);
            throw new GatewayException(message != null ? message : "AI gateway trả lỗi " + e.getStatusCode().value());
        } catch (RuntimeException e) {
            log.warn("[AI gateway] {} failed: {}", feature, e.getMessage());
            throw new GatewayException("Không gọi được AI gateway.");
        }
        JsonNode data = res == null ? null : res.path("data");
        if (data == null || data.isMissingNode() || data.isNull()) throw new GatewayException("AI gateway không trả dữ liệu.");
        return new Answer(data.path("json"), data.path("inputTokens").asInt(0), data.path("outputTokens").asInt(0),
                data.path("model").asText(null));
    }

    private static String messageOf(String body) {
        try {
            JsonNode n = QuizBankRules.json().readTree(body);
            String m = n.path("message").asText(null);
            return m == null || m.isBlank() ? null : m;
        } catch (Exception e) {
            return null;
        }
    }
}
