package com.elevenof.backoffice.service.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Pitch diagram of a question, stored as JSON and drawn as SVG by the site. Coordinates are 0..100 on both axes:
 * x from our own goal line (0) to the opponent's (100), so our team always attacks to the right; y from the top
 * touchline (0) to the bottom one (100). Shape:
 * <pre>
 * {"players":[{"team":"own|opp","x":50,"y":40,"label":"8","me":true}],
 *  "ball":{"x":52,"y":41},
 *  "arrows":[{"kind":"run|pass|shot|dribble","from":[50,40],"to":[70,30]}],
 *  "zones":[{"x":60,"y":20,"w":20,"h":30,"label":"Khoảng trống"}]}
 * </pre>
 * {@link #sanitize} keeps only these fields, clamps numbers and caps list sizes, so whatever the AI or an editor
 * sends is safe to store and draw.
 */
public final class QuizDiagram {

    private QuizDiagram() {}

    public static final int MAX_PLAYERS = 22;
    public static final int MAX_ARROWS = 12;
    public static final int MAX_ZONES = 6;
    public static final Set<String> TEAMS = Set.of("own", "opp");
    public static final Set<String> ARROW_KINDS = Set.of("run", "pass", "shot", "dribble");

    /** The diagram as clean JSON, or null when it has no player (nothing worth drawing) or is not an object. */
    public static String sanitize(JsonNode in) {
        if (in == null || !in.isObject()) return null;
        ObjectNode out = QuizBankRules.json().createObjectNode();
        ArrayNode players = out.putArray("players");
        boolean me = false;
        for (JsonNode p : in.path("players")) {
            if (players.size() >= MAX_PLAYERS) break;
            if (!p.path("x").isNumber() || !p.path("y").isNumber()) continue;
            ObjectNode row = players.addObject();
            row.put("team", TEAMS.contains(p.path("team").asText()) ? p.path("team").asText() : "own");
            row.put("x", clamp(p.path("x").asDouble()));
            row.put("y", clamp(p.path("y").asDouble()));
            String label = text(p.path("label").asText(""), 3);
            if (!label.isEmpty()) row.put("label", label);
            if (p.path("me").asBoolean(false) && !me) {
                row.put("me", true);
                me = true;
            }
        }
        if (players.isEmpty()) return null;
        JsonNode ball = in.path("ball");
        if (ball.path("x").isNumber() && ball.path("y").isNumber()) {
            ObjectNode b = out.putObject("ball");
            b.put("x", clamp(ball.path("x").asDouble()));
            b.put("y", clamp(ball.path("y").asDouble()));
        }
        ArrayNode arrows = out.putArray("arrows");
        for (JsonNode a : in.path("arrows")) {
            if (arrows.size() >= MAX_ARROWS) break;
            double[] from = point(a.path("from"));
            double[] to = point(a.path("to"));
            if (from == null || to == null) continue;
            ObjectNode row = arrows.addObject();
            row.put("kind", ARROW_KINDS.contains(a.path("kind").asText()) ? a.path("kind").asText() : "run");
            row.putArray("from").add(from[0]).add(from[1]);
            row.putArray("to").add(to[0]).add(to[1]);
        }
        ArrayNode zones = out.putArray("zones");
        for (JsonNode z : in.path("zones")) {
            if (zones.size() >= MAX_ZONES) break;
            if (!z.path("x").isNumber() || !z.path("y").isNumber() || !z.path("w").isNumber() || !z.path("h").isNumber()) continue;
            ObjectNode row = zones.addObject();
            double x = clamp(z.path("x").asDouble()), y = clamp(z.path("y").asDouble());
            row.put("x", x);
            row.put("y", y);
            row.put("w", Math.min(clamp(z.path("w").asDouble()), 100 - x));
            row.put("h", Math.min(clamp(z.path("h").asDouble()), 100 - y));
            String label = text(z.path("label").asText(""), 30);
            if (!label.isEmpty()) row.put("label", label);
        }
        return out.toString();
    }

    /** JSON schema of the diagram for the AI tool. */
    public static Map<String, Object> schema() {
        Map<String, Object> num = Map.of("type", "number", "minimum", 0, "maximum", 100);
        Map<String, Object> point = Map.of("type", "array", "items", Map.of("type", "number"), "minItems", 2, "maxItems", 2);
        return Map.of("type", "object",
                "description", "Sơ đồ sân. Tọa độ 0..100: x từ khung thành đội mình (0) đến khung thành đối thủ (100), đội mình luôn tấn công sang phải; y từ biên trên (0) đến biên dưới (100).",
                "properties", Map.of(
                        "players", Map.of("type", "array", "maxItems", MAX_PLAYERS, "items", Map.of("type", "object",
                                "properties", Map.of(
                                        "team", Map.of("type", "string", "enum", List.of("own", "opp")),
                                        "x", num, "y", num,
                                        "label", Map.of("type", "string", "description", "số áo hoặc viết tắt vị trí, tối đa 3 ký tự"),
                                        "me", Map.of("type", "boolean", "description", "true cho đúng một cầu thủ là người trả lời câu hỏi")),
                                "required", List.of("team", "x", "y"))),
                        "ball", Map.of("type", "object", "properties", Map.of("x", num, "y", num), "required", List.of("x", "y")),
                        "arrows", Map.of("type", "array", "maxItems", MAX_ARROWS, "items", Map.of("type", "object",
                                "properties", Map.of(
                                        "kind", Map.of("type", "string", "enum", List.of("run", "pass", "shot", "dribble")),
                                        "from", point, "to", point),
                                "required", List.of("kind", "from", "to"))),
                        "zones", Map.of("type", "array", "maxItems", MAX_ZONES, "items", Map.of("type", "object",
                                "properties", Map.of("x", num, "y", num, "w", num, "h", num, "label", Map.of("type", "string")),
                                "required", List.of("x", "y", "w", "h")))),
                "required", List.of("players"));
    }

    private static double[] point(JsonNode n) {
        if (!n.isArray() || n.size() != 2 || !n.get(0).isNumber() || !n.get(1).isNumber()) return null;
        return new double[]{clamp(n.get(0).asDouble()), clamp(n.get(1).asDouble())};
    }

    private static double clamp(double v) {
        if (Double.isNaN(v)) return 0;
        return Math.round(Math.max(0, Math.min(100, v)) * 10) / 10.0;
    }

    private static String text(String s, int max) {
        String t = s == null ? "" : s.replaceAll("[\\p{Cntrl}<>]", "").trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
