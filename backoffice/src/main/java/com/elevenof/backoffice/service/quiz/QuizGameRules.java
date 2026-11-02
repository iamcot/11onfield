package com.elevenof.backoffice.service.quiz;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.*;

/** Pure rules of the players' side: ranks, stars, difficulty mix, option shuffles, flags, periods, mock grading. */
public final class QuizGameRules {

    private QuizGameRules() {}

    public record Rank(String key, String label) {}

    /** From the lowest; "Huyền thoại" has no ceiling. */
    public static final List<Rank> RANKS = List.of(
            new Rank("phong_trao", "Phong trào"), new Rank("nang_khieu", "Năng khiếu"), new Rank("hoc_vien", "Học viện"),
            new Rank("u19", "U19"), new Rank("du_bi", "Dự bị"), new Rank("da_chinh", "Đá chính"),
            new Rank("doi_tuyen", "Đội tuyển"), new Rank("huyen_thoai", "Huyền thoại"));

    /** Share (percent) of difficulty 1..5 per rank; every row adds up to 100. */
    public static final int[][] MIX = {
            {80, 20, 0, 0, 0},
            {50, 40, 10, 0, 0},
            {20, 50, 30, 0, 0},
            {10, 30, 50, 10, 0},
            {0, 20, 50, 30, 0},
            {0, 10, 40, 40, 10},
            {0, 0, 30, 40, 30},
            {0, 0, 10, 40, 50}};

    public static final long FAST_MS = 1500;
    public static final long LATE_GRACE_MS = 2000;

    // ---------- stars and ranks ----------

    public record State(int rank, int stars, int guard) {}

    public record Result(State after, boolean correct, int starsDelta, boolean rankedUp, boolean rankedDown, boolean guardLost) {}

    public static State start() {
        return new State(0, 0, 1);
    }

    public static boolean isLastRank(int rank) {
        return rank >= RANKS.size() - 1;
    }

    /**
     * One graded rank question (ported from AnyLearn's QuizProgress). Right: +1 star; with a full bar the next right
     * answer promotes and the new rank starts at 1 star. Wrong: -1 star; losing the last star only empties the bar
     * (guard off); the next miss drops to the lower rank with `perRank - 1` stars and the guard back. The lowest rank never drops.
     */
    public static Result apply(State before, boolean correct, int perRank) {
        int rank = before.rank(), have = before.stars(), guard = before.guard();
        if (correct) {
            have++;
            boolean up = false;
            if (!isLastRank(rank) && have > perRank) {
                rank++;
                have = 1;
                up = true;
            }
            return new Result(new State(rank, have, 1), true, 1, up, false, false);
        }
        if (have > 0) {
            have--;
            if (have == 0 && rank > 0) guard = 0;
            return new Result(new State(rank, have, guard), false, -1, false, false, false);
        }
        if (guard == 1) return new Result(new State(rank, 0, 0), false, 0, false, false, rank > 0);
        if (rank > 0) return new Result(new State(rank - 1, Math.max(perRank - 1, 0), 1), false, 0, false, true, false);
        return new Result(before, false, 0, false, false, false);
    }

    /** Difficulty 1..5 for one question of `rank`; `roll` is a random number in [0, 1). */
    public static int pickDifficulty(int rank, double roll) {
        int[] mix = MIX[Math.max(0, Math.min(rank, MIX.length - 1))];
        double point = roll * 100, sum = 0;
        for (int i = 0; i < mix.length; i++) {
            sum += mix[i];
            if (point < sum) return i + 1;
        }
        return 1;
    }

    /** Other difficulties to try when a level is empty: nearest first, easier before harder. */
    public static List<Integer> fallbackLevels(int level) {
        List<Integer> out = new ArrayList<>();
        for (int d = 1; d <= 4; d++) {
            if (level - d >= 1) out.add(level - d);
            if (level + d <= 5) out.add(level + d);
        }
        return out;
    }

    // ---------- options ----------

    /** A random order of the 4 stored options, as 4 digits ("2013" = shown A is stored option 2). */
    public static String shuffleOrder(Random random) {
        List<Integer> idx = new ArrayList<>(List.of(0, 1, 2, 3));
        Collections.shuffle(idx, random);
        StringBuilder out = new StringBuilder();
        for (int i : idx) out.append(i);
        return out.toString();
    }

    public static boolean validOrder(String order) {
        if (order == null || order.length() != 4) return false;
        Set<Character> seen = new HashSet<>();
        for (char c : order.toCharArray()) if (c < '0' || c > '3' || !seen.add(c)) return false;
        return true;
    }

    /** Stored option index shown at `shown` (0..3). */
    public static int storedAt(String order, int shown) {
        return order.charAt(shown) - '0';
    }

    /** Shown position of stored option `stored`. */
    public static int shownOf(String order, int stored) {
        return order.indexOf((char) ('0' + stored));
    }

    public static <T> List<T> inShownOrder(List<T> stored, String order) {
        List<T> out = new ArrayList<>();
        for (int i = 0; i < 4; i++) out.add(stored.get(storedAt(order, i)));
        return out;
    }

    // ---------- timing ----------

    public static boolean isLate(long answeredMs, long expiresMs) {
        return answeredMs > expiresMs + LATE_GRACE_MS;
    }

    public static boolean flagged(boolean correct, long tookMs, boolean away) {
        return correct && (tookMs < FAST_MS || away);
    }

    // ---------- periods and names ----------

    public static String weekKey(LocalDate day) {
        return String.format("W%d-%02d", day.get(IsoFields.WEEK_BASED_YEAR), day.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
    }

    public static String monthKey(LocalDate day) {
        return String.format("M%d-%02d", day.getYear(), day.getMonthValue());
    }

    /** Last two words of a full name ("Nguyễn Văn An" -> "Văn An"); never the phone or e-mail. */
    public static String displayName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Cầu thủ";
        String[] parts = fullName.trim().split("\\s+");
        return parts.length <= 2 ? String.join(" ", parts) : parts[parts.length - 2] + " " + parts[parts.length - 1];
    }

    // ---------- mock exam ----------

    /** Spreads `size` picks across `topics` in turn ("laws, tactics, reading, laws, ..."). */
    public static List<String> spreadTopics(List<String> topics, int size) {
        List<String> out = new ArrayList<>();
        if (topics.isEmpty()) return out;
        for (int i = 0; i < size; i++) out.add(topics.get(i % topics.size()));
        return out;
    }

    /** Percent, rounded. */
    public static int percent(int right, int total) {
        return total <= 0 ? 0 : Math.round(100f * right / total);
    }

    public static List<Integer> parseInts(String csv) {
        List<Integer> out = new ArrayList<>();
        if (csv == null || csv.isBlank()) return out;
        for (String p : csv.split(",")) {
            try {
                out.add(Integer.parseInt(p.trim()));
            } catch (NumberFormatException e) {
                out.add(-1);
            }
        }
        return out;
    }
}
