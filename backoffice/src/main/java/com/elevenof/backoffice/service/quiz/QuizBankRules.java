package com.elevenof.backoffice.service.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

/** Pure rules of the football quiz question bank (ported from AnyLearn's QuizRules, adapted for football). */
public final class QuizBankRules {

    private QuizBankRules() {}

    private static final ObjectMapper JSON = new ObjectMapper();

    public static final List<Integer> DIFFICULTIES = List.of(1, 2, 3, 4, 5);
    public static final Map<Integer, String> LEVEL_LABELS = Map.of(1, "Rất dễ", 2, "Dễ", 3, "Vừa", 4, "Khó", 5, "Rất khó");
    public static final Set<String> STATUSES = Set.of("pending", "active", "hidden");
    public static final Set<String> POOLS = Set.of("practice", "exam");
    public static final Set<String> GROUPS = Set.of("knowledge", "thinking", "situation");
    public static final Set<String> MEDIA_TYPES = Set.of("none", "diagram", "image");

    public static final int MAX_BODY = 600;
    public static final int MAX_OPTION = 200;
    public static final int MAX_EXPLANATION = 600;
    public static final int MAX_BATCH = 10;
    public static final int MAX_DIAGRAM_BATCH = 4;
    public static final int DEFAULT_TARGET = 30;

    private static final Pattern TOPIC_KEY = Pattern.compile("^[a-z0-9_]{2,30}$");

    /** One question as written by the AI or typed by an editor; `diagram` is sanitized JSON or null. */
    public record Candidate(String body, List<String> options, int correct, String explanation, String diagram) {}

    public static boolean validTopicKey(String key) {
        return key != null && TOPIC_KEY.matcher(key).matches();
    }

    /** Topic key from a label ("Đọc tình huống" -> "doc_tinh_huong"). */
    public static String topicKeyFrom(String label) {
        String key = normalize(label).replace(' ', '_');
        return key.length() > 30 ? key.substring(0, 30) : key;
    }

    /** Lower case, no accents (đ -> d), letters and digits only, single spaces. */
    public static String normalize(String text) {
        if (text == null) return "";
        String plain = Normalizer.normalize(text.replace('đ', 'd').replace('Đ', 'D'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        return plain.replaceAll("[^\\p{L}\\p{N} ]", " ").replaceAll("\\s+", " ").trim();
    }

    public static String hash(String body) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(normalize(body).getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (byte b : digest) out.append(String.format("%02x", b));
            return out.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Word overlap (Jaccard) of two normalised questions; 0.8 and above counts as the same question. */
    public static double similarity(String a, String b) {
        Set<String> first = new HashSet<>(Arrays.asList(normalize(a).split(" ")));
        Set<String> second = new HashSet<>(Arrays.asList(normalize(b).split(" ")));
        first.remove("");
        second.remove("");
        if (first.isEmpty() || second.isEmpty()) return 0;
        Set<String> both = new HashSet<>(first);
        both.retainAll(second);
        Set<String> all = new HashSet<>(first);
        all.addAll(second);
        return (double) both.size() / all.size();
    }

    public static boolean isDuplicate(String body, Set<String> knownHashes, Collection<String> knownBodies) {
        if (knownHashes.contains(hash(body))) return true;
        for (String other : knownBodies) if (similarity(body, other) >= 0.8) return true;
        return false;
    }

    /** Why a candidate cannot be saved, null when it is fine. */
    public static String problem(Candidate c) {
        if (c == null || c.body() == null) return "Thiếu câu hỏi";
        String body = c.body().trim();
        if (body.length() < 10 || body.length() > MAX_BODY) return "Câu hỏi phải từ 10 đến " + MAX_BODY + " ký tự";
        if (c.options() == null || c.options().size() != 4) return "Cần đúng 4 đáp án";
        Set<String> seen = new HashSet<>();
        for (String option : c.options()) {
            if (option == null || option.isBlank() || option.trim().length() > MAX_OPTION) return "Đáp án trống hoặc quá dài";
            if (!seen.add(normalize(option))) return "Có hai đáp án giống nhau";
        }
        if (c.correct() < 0 || c.correct() > 3) return "Đáp án đúng phải là A, B, C hoặc D";
        if (c.explanation() != null && c.explanation().length() > MAX_EXPLANATION) return "Giải thích quá dài";
        return null;
    }

    /**
     * Reads the `write_questions` tool answer. Entries that fail {@link #problem} are counted in {@code invalid[0]};
     * when `withDiagram` is set a question without a usable diagram is invalid too.
     */
    public static List<Candidate> parseQuestions(JsonNode root, boolean withDiagram, int[] invalid) {
        List<Candidate> out = new ArrayList<>();
        if (root == null) return out;
        for (JsonNode node : root.path("questions")) {
            List<String> options = new ArrayList<>();
            for (JsonNode o : node.path("options")) options.add(o.asText("").trim());
            String diagram = node.has("diagram") ? QuizDiagram.sanitize(node.get("diagram")) : null;
            Candidate c = new Candidate(node.path("body").asText("").trim(), options,
                    node.path("correct").asInt(-1), node.path("explanation").asText("").trim(), diagram);
            boolean ok = problem(c) == null && (!withDiagram || diagram != null);
            if (ok) out.add(c);
            else if (invalid != null) invalid[0]++;
        }
        return out;
    }

    /** Reads the `answer_questions` tool answer into index -> chosen option (0..3). */
    public static Map<Integer, Integer> parseAnswers(JsonNode root) {
        Map<Integer, Integer> out = new HashMap<>();
        if (root == null) return out;
        for (JsonNode node : root.path("answers")) {
            int index = node.path("index").asInt(-1);
            int choice = node.path("choice").asInt(-1);
            if (index >= 0 && choice >= 0 && choice <= 3) out.put(index, choice);
        }
        return out;
    }

    /** The AI likes to put the right answer first; the stored order is shuffled so it is spread evenly. */
    public static Candidate shuffled(Candidate c, Random random) {
        List<String> options = new ArrayList<>(c.options());
        String right = options.get(c.correct());
        Collections.shuffle(options, random);
        return new Candidate(c.body(), options, options.indexOf(right), c.explanation(), c.diagram());
    }

    /** Status and note after the AI's blind answer: agreed = waits for review (verified 1), other answer = hidden (-1). */
    public record Verdict(String status, int verified, String note) {}

    public static Verdict verdict(Integer blindChoice, int correct) {
        if (blindChoice == null) return new Verdict("pending", 0, "AI kiểm tra bỏ qua câu này");
        if (blindChoice == correct) return new Verdict("pending", 1, null);
        return new Verdict("hidden", -1, "AI kiểm tra chọn " + (char) ('A' + blindChoice) + ", khác đáp án");
    }

    /** How many more questions a cell needs to reach its target (pending ones count, they are on the way). */
    public static int shortfall(int active, int pending, int target) {
        return Math.max(target - active - pending, 0);
    }

    public static String cellKey(String topic, int difficulty) {
        return topic + ":" + difficulty;
    }

    static ObjectMapper json() {
        return JSON;
    }
}
