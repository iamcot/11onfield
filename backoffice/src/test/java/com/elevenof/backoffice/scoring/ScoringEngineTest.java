package com.elevenof.backoffice.scoring;

import com.elevenof.backoffice.model.ScoringMethod;
import com.elevenof.backoffice.model.ValueDirection;
import com.elevenof.backoffice.scoring.ScoringEngine.AssessmentSpec;
import com.elevenof.backoffice.scoring.ScoringEngine.Bound;
import com.elevenof.backoffice.scoring.ScoringEngine.Level;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ScoringEngineTest {

    private static final long SPRINT = 1L;
    private static final long SPEED = 2L;
    private static final long HITS = 3L;

    private static BigDecimal d(String s) {
        return new BigDecimal(s);
    }

    private static Bound b(String min, String max) {
        return new Bound(min == null ? null : d(min), max == null ? null : d(max));
    }

    /** Sprint 30 m, lower is better; sample bands. */
    private static List<Level> sprintScale() {
        return List.of(
                new Level(5, Map.of(SPRINT, b(null, "4.10"))),
                new Level(4, Map.of(SPRINT, b("4.11", "4.30"))),
                new Level(3, Map.of(SPRINT, b("4.31", "4.50"))),
                new Level(2, Map.of(SPRINT, b("4.51", "4.70"))),
                new Level(1, Map.of()));
    }

    /** Shot: speed and hits on target, each level a threshold. */
    private static List<Level> shotScale() {
        return List.of(
                new Level(5, Map.of(SPEED, b("115", null), HITS, b("5", null))),
                new Level(4, Map.of(SPEED, b("100", null), HITS, b("4", null))),
                new Level(3, Map.of(SPEED, b("90", null), HITS, b("3", null))),
                new Level(2, Map.of(SPEED, b("80", null), HITS, b("2", null))),
                new Level(1, Map.of()));
    }

    private static int rate(List<Level> scale, Object... kv) {
        Map<Long, BigDecimal> m = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((Long) kv[i], d((String) kv[i + 1]));
        return ScoringEngine.rate(m, scale).level();
    }

    @Test
    void bestOfFollowsDirection() {
        List<BigDecimal> v = Arrays.asList(d("4.52"), d("4.38"), null);
        assertEquals(d("4.38"), ScoringEngine.aggregate(v, ScoringMethod.BEST_OF, ValueDirection.LOWER));
        assertEquals(d("4.52"), ScoringEngine.aggregate(v, ScoringMethod.BEST_OF, ValueDirection.HIGHER));
        assertEquals(d("8.90"), ScoringEngine.aggregate(v, ScoringMethod.SUM, ValueDirection.HIGHER));
        assertEquals(d("4.450"), ScoringEngine.aggregate(v, ScoringMethod.AVERAGE, ValueDirection.HIGHER));
        assertNull(ScoringEngine.aggregate(Arrays.asList(null, null), ScoringMethod.BEST_OF, ValueDirection.LOWER));
    }

    @Test
    void sprintEdges() {
        assertEquals(5, rate(sprintScale(), SPRINT, "4.10"));
        assertEquals(4, rate(sprintScale(), SPRINT, "4.11"));
        assertEquals(2, rate(sprintScale(), SPRINT, "4.70"));
        assertEquals(1, rate(sprintScale(), SPRINT, "4.71"));
        assertEquals(1, rate(sprintScale(), SPRINT, "5.01"));
    }

    @Test
    void everyAssessmentMustReachTheLevel() {
        assertEquals(4, rate(shotScale(), SPEED, "112", HITS, "4"));
        assertEquals(4, rate(shotScale(), SPEED, "120", HITS, "4"));
        assertEquals(5, rate(shotScale(), SPEED, "120", HITS, "5"));
        assertEquals(1, rate(shotScale(), SPEED, "79", HITS, "5"));
    }

    @Test
    void bandsWorkPerAssessmentToo() {
        List<Level> scale = List.of(
                new Level(5, Map.of(SPEED, b("115", null), HITS, b("5", "5"))),
                new Level(4, Map.of(SPEED, b("100", "114.9"), HITS, b("4", "4"))),
                new Level(1, Map.of()));
        assertEquals(4, rate(scale, SPEED, "120", HITS, "4"));
    }

    @Test
    void missingValueGivesNoRating() {
        assertNull(ScoringEngine.rate(Map.of(SPEED, d("112")), shotScale()));
    }

    @Test
    void validCompleteScalePasses() {
        Map<Long, AssessmentSpec> specs = Map.of(SPRINT, new AssessmentSpec("Sprint 30 m", ValueDirection.LOWER, d("3.2"), d("8")));
        assertEquals(List.of(), ScoringEngine.validate(sprintScale(), specs));
        Map<Long, AssessmentSpec> shot = Map.of(
                SPEED, new AssessmentSpec("Tốc độ sút", ValueDirection.HIGHER, null, null),
                HITS, new AssessmentSpec("Trúng đích", ValueDirection.HIGHER, null, null));
        // Thresholds only (no max): each level is open upward, which is how a threshold scale is written.
        List<Level> thresholds = List.of(
                new Level(5, Map.of(SPEED, b("115", null))),
                new Level(4, Map.of(SPEED, b("100", "114.99"))),
                new Level(1, Map.of()));
        assertEquals(List.of(), ScoringEngine.validate(thresholds, shot));
    }

    @Test
    void reportsHoleBetweenLevels() {
        List<Level> jump = List.of(
                new Level(5, Map.of(1L, b("70", null))),
                new Level(4, Map.of(1L, b("65", "69"))),
                new Level(3, Map.of(1L, b("61", "64"))),
                new Level(2, Map.of(1L, b("55", "59"))),
                new Level(1, Map.of()));
        List<String> p = ScoringEngine.validate(jump, Map.of(1L, new AssessmentSpec("Bật cao", ValueDirection.HIGHER, null, null)));
        assertEquals(List.of("Bật cao: 59–61 chưa thuộc mức nào (giữa mức 2 và mức 3)"), p);
    }

    @Test
    void reportsOverlapAndWrongDirection() {
        List<Level> overlap = List.of(
                new Level(5, Map.of(SPRINT, b(null, "4.10"))),
                new Level(4, Map.of(SPRINT, b("4.05", "4.30"))));
        List<String> p = ScoringEngine.validate(overlap, Map.of(SPRINT, new AssessmentSpec("Sprint", ValueDirection.LOWER, null, null)));
        assertEquals(1, p.size());
        assertTrue(p.get(0).contains("chồng nhau"), p.get(0));

        List<Level> reversed = List.of(
                new Level(5, Map.of(SPRINT, b("4.51", "4.70"))),
                new Level(4, Map.of(SPRINT, b("4.31", "4.50"))));
        List<String> r = ScoringEngine.validate(reversed, Map.of(SPRINT, new AssessmentSpec("Sprint", ValueDirection.LOWER, null, null)));
        assertTrue(r.stream().anyMatch(s -> s.contains("phải tốt hơn")), r.toString());
    }

    @Test
    void greyBandMustReachPlausibleRange() {
        List<Level> scale = new ArrayList<>(sprintScale().subList(0, 4));
        scale.add(new Level(1, Map.of(SPRINT, b("4.71", "6.00"))));
        List<String> p = ScoringEngine.validate(scale, Map.of(SPRINT, new AssessmentSpec("Sprint 30 m", ValueDirection.LOWER, d("3.2"), d("8"))));
        assertEquals(List.of("Sprint 30 m: 6–8 chưa thuộc mức nào"), p);
    }

    @Test
    void topicAndDay() {
        assertEquals(d("16.00"), ScoringEngine.topicPoints(d("20"), List.of(3, 4, 5)));
        assertNull(ScoringEngine.topicPoints(d("20"), Arrays.asList(3, null, 5)));
        assertNull(ScoringEngine.topicPoints(d("20"), List.of()));
        ScoringEngine.DayTotal t = ScoringEngine.dayTotal(Arrays.asList(d("8"), d("16.00"), null));
        assertEquals(d("24.00"), t.points());
        assertFalse(t.complete());
        assertTrue(ScoringEngine.dayTotal(List.of(d("8"), d("16"))).complete());
    }

    @Test
    void sameInputSameResult() {
        Map<Long, BigDecimal> v = Map.of(SPEED, d("112"), HITS, d("4"));
        assertEquals(ScoringEngine.rate(v, shotScale()), ScoringEngine.rate(new HashMap<>(v), shotScale()));
    }

    @Test
    void nearBoundary() {
        assertTrue(ScoringEngine.nearBoundary(d("4.11"), d("0.02"), SPRINT, sprintScale()));
        assertFalse(ScoringEngine.nearBoundary(d("4.20"), d("0.02"), SPRINT, sprintScale()));
    }
}
