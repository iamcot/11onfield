package com.elevenof.backoffice.scoring;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class RoundFormulaTest {

    private static final RoundFormula F = RoundFormula.combineRound1();

    private static BigDecimal d(String s) {
        return new BigDecimal(s);
    }

    private static Map<String, BigDecimal> points(String day1, String gps, String bhl, String mind) {
        Map<String, BigDecimal> m = new HashMap<>();
        m.put("DAY1", RoundFormula.componentPoints(F.components().get(0), day1 == null ? null : d(day1)));
        m.put("GPS_AI", gps == null ? null : d(gps));
        m.put("BHL", bhl == null ? null : d(bhl));
        m.put("MIND_MEDIA", mind == null ? null : d(mind));
        return m;
    }

    @Test
    void defaultFormulaIsValidAndWorth100() {
        assertEquals(List.of(), F.validate());
        assertEquals(d("100.00"), F.maxTotal());
    }

    @Test
    void totalAndClass() {
        RoundFormula.Total t = F.total(points("82", "17", "34", "8"));
        assertEquals(d("83.60"), t.total());
        assertTrue(t.complete());
        assertEquals("Professional Potential", t.classification());
    }

    @Test
    void missingBhlIsIncomplete() {
        RoundFormula.Total t = F.total(points("82", "17", null, "8"));
        assertFalse(t.complete());
        assertNull(t.classification());
        assertEquals(d("49.60"), t.total());
    }

    @Test
    void manualIsCapped() {
        assertEquals(d("40.00"), RoundFormula.componentPoints(F.components().get(2), d("45")));
    }

    @Test
    void tieBreakByMindThenDiscipline() {
        RoundFormula.Entry a = new RoundFormula.Entry(1L, d("80"), true, Map.of("MIND", d("14")), 0);
        RoundFormula.Entry b = new RoundFormula.Entry(2L, d("80"), true, Map.of("MIND", d("16")), 0);
        RoundFormula.Entry c = new RoundFormula.Entry(3L, d("80"), true, Map.of("MIND", d("16")), 2);
        RoundFormula.Entry incomplete = new RoundFormula.Entry(4L, d("95"), false, Map.of(), 0);
        List<RoundFormula.Entry> l = new ArrayList<>(List.of(incomplete, c, a, b));
        l.sort(F.order());
        assertEquals(List.of(2L, 3L, 1L, 4L), l.stream().map(RoundFormula.Entry::participantId).toList());
        assertFalse(F.tied(b, c));
        assertTrue(F.tied(b, new RoundFormula.Entry(9L, d("80"), true, Map.of("MIND", d("16")), 0)));
    }

    @Test
    void rejectsBadFormula() {
        RoundFormula bad = new RoundFormula(List.of(new RoundFormula.Component("X", "X", "DAY", null, null, null),
                new RoundFormula.Component("X", "X", "MANUAL", null, null, null)), Map.of(), List.of(), List.of());
        assertEquals(4, bad.validate().size());
    }
}
