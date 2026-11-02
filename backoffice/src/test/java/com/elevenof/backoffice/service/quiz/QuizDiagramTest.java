package com.elevenof.backoffice.service.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class QuizDiagramTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static JsonNode clean(String in) throws Exception {
        String out = QuizDiagram.sanitize(JSON.readTree(in));
        return out == null ? null : JSON.readTree(out);
    }

    @Test
    void keepsKnownFieldsAndClampsNumbers() throws Exception {
        JsonNode d = clean("""
                {"players":[{"team":"own","x":120,"y":-5,"label":"10ABC","me":true,"hack":"<script>"},
                            {"team":"martians","x":40,"y":40,"me":true}],
                 "ball":{"x":50.04,"y":40},
                 "arrows":[{"kind":"teleport","from":[1,2],"to":[3,4]},{"kind":"pass","from":[1],"to":[3,4]}],
                 "zones":[{"x":90,"y":90,"w":50,"h":50,"label":"Khoảng trống"}],
                 "extra":1}""");
        assertNotNull(d);
        JsonNode p0 = d.path("players").get(0);
        assertEquals(100.0, p0.path("x").asDouble());
        assertEquals(0.0, p0.path("y").asDouble());
        assertEquals("10A", p0.path("label").asText());
        assertFalse(p0.has("hack"));
        assertTrue(p0.path("me").asBoolean());
        JsonNode p1 = d.path("players").get(1);
        assertEquals("own", p1.path("team").asText(), "unknown team falls back to own");
        assertFalse(p1.has("me"), "only one player can be 'me'");
        assertEquals(50.0, d.path("ball").path("x").asDouble());
        assertEquals(1, d.path("arrows").size(), "an arrow without two points is dropped");
        assertEquals("run", d.path("arrows").get(0).path("kind").asText());
        assertEquals(10.0, d.path("zones").get(0).path("w").asDouble(), "zone stays on the pitch");
        assertFalse(d.has("extra"));
    }

    @Test
    void nothingToDrawGivesNull() throws Exception {
        assertNull(clean("{\"players\":[]}"));
        assertNull(clean("{\"players\":[{\"team\":\"own\",\"x\":\"a\",\"y\":1}]}"));
        assertNull(clean("[1,2]"));
        assertNull(QuizDiagram.sanitize(null));
    }

    @Test
    void capsListSizes() throws Exception {
        StringBuilder players = new StringBuilder();
        for (int i = 0; i < 30; i++) players.append(i == 0 ? "" : ",").append("{\"team\":\"opp\",\"x\":").append(i).append(",\"y\":5}");
        JsonNode d = clean("{\"players\":[" + players + "]}");
        assertEquals(QuizDiagram.MAX_PLAYERS, d.path("players").size());
    }

    @Test
    void gatewayUrlComesFromTheRelayUrl() {
        assertEquals("https://anylearn.vn/v2/api/open/ai/tool", AiGatewayClient.gatewayUrl("https://anylearn.vn/v2/api/open/zns/otp"));
        assertEquals("http://127.0.0.1:8080/v2/api/open/ai/tool", AiGatewayClient.gatewayUrl("http://127.0.0.1:8080/v2/api/open/zns/otp/"));
        assertNull(AiGatewayClient.gatewayUrl(""));
        assertNull(AiGatewayClient.gatewayUrl("https://example.com/other"));
    }
}
