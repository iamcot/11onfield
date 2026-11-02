package com.elevenof.backoffice.service.quiz;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class QuizGameRulesTest {

    private static QuizGameRules.State s(int rank, int stars, int guard) {
        return new QuizGameRules.State(rank, stars, guard);
    }

    @Test
    void aRightAnswerAddsAStarAndAFullBarPromotesOnTheNextOne() {
        assertEquals(s(0, 1, 1), QuizGameRules.apply(QuizGameRules.start(), true, 5).after());
        QuizGameRules.Result full = QuizGameRules.apply(s(0, 4, 1), true, 5);
        assertEquals(s(0, 5, 1), full.after());
        assertFalse(full.rankedUp());
        QuizGameRules.Result up = QuizGameRules.apply(s(0, 5, 1), true, 5);
        assertEquals(s(1, 1, 1), up.after());
        assertTrue(up.rankedUp());
    }

    @Test
    void theLastRankKeepsCollectingStars() {
        int last = QuizGameRules.RANKS.size() - 1;
        assertEquals(s(last, 9, 1), QuizGameRules.apply(s(last, 8, 1), true, 5).after());
    }

    @Test
    void missesTakeAStarThenTheGuardThenTheRank() {
        QuizGameRules.Result r = QuizGameRules.apply(s(2, 1, 1), false, 5);
        assertEquals(s(2, 0, 0), r.after(), "losing the last star of a rank above the lowest drops the guard");
        assertEquals(-1, r.starsDelta());
        QuizGameRules.Result down = QuizGameRules.apply(s(2, 0, 0), false, 5);
        assertEquals(s(1, 4, 1), down.after());
        assertTrue(down.rankedDown());
        QuizGameRules.Result guard = QuizGameRules.apply(s(2, 0, 1), false, 5);
        assertEquals(s(2, 0, 0), guard.after());
        assertTrue(guard.guardLost());
    }

    @Test
    void theLowestRankNeverDrops() {
        assertEquals(s(0, 0, 1), QuizGameRules.apply(s(0, 1, 1), false, 5).after());
        assertEquals(s(0, 0, 0), QuizGameRules.apply(s(0, 0, 1), false, 5).after());
        assertEquals(s(0, 0, 0), QuizGameRules.apply(s(0, 0, 0), false, 5).after());
    }

    @Test
    void everyMixRowAddsUpTo100AndPicksFollowIt() {
        assertEquals(QuizGameRules.RANKS.size(), QuizGameRules.MIX.length);
        for (int[] row : QuizGameRules.MIX) {
            int sum = 0;
            for (int v : row) sum += v;
            assertEquals(100, sum);
        }
        assertEquals(1, QuizGameRules.pickDifficulty(0, 0.0));
        assertEquals(2, QuizGameRules.pickDifficulty(0, 0.85));
        assertEquals(5, QuizGameRules.pickDifficulty(7, 0.99));
        assertEquals(List.of(2, 4, 1, 5), QuizGameRules.fallbackLevels(3));
        assertEquals(List.of(2, 3, 4, 5), QuizGameRules.fallbackLevels(1));
    }

    @Test
    void optionOrdersMapShownAndStoredPositions() {
        for (int seed = 0; seed < 30; seed++) assertTrue(QuizGameRules.validOrder(QuizGameRules.shuffleOrder(new Random(seed))));
        assertFalse(QuizGameRules.validOrder("0012"));
        assertFalse(QuizGameRules.validOrder("012"));
        String order = "2013";
        assertEquals(2, QuizGameRules.storedAt(order, 0));
        assertEquals(0, QuizGameRules.shownOf(order, 2));
        assertEquals(3, QuizGameRules.shownOf(order, 3));
        assertEquals(List.of("c", "a", "b", "d"), QuizGameRules.inShownOrder(List.of("a", "b", "c", "d"), order));
    }

    @Test
    void lateAndFlaggedAnswers() {
        assertFalse(QuizGameRules.isLate(10_000 + 2000, 10_000));
        assertTrue(QuizGameRules.isLate(10_000 + 2001, 10_000));
        assertTrue(QuizGameRules.flagged(true, 900, false));
        assertTrue(QuizGameRules.flagged(true, 5000, true));
        assertFalse(QuizGameRules.flagged(false, 500, true), "a wrong answer is never flagged");
        assertFalse(QuizGameRules.flagged(true, 5000, false));
    }

    @Test
    void periodsAndNames() {
        assertEquals("W2026-45", QuizGameRules.weekKey(LocalDate.of(2026, 11, 2)));
        assertEquals("W2026-53", QuizGameRules.weekKey(LocalDate.of(2027, 1, 1)));
        assertEquals("M2026-11", QuizGameRules.monthKey(LocalDate.of(2026, 11, 2)));
        assertEquals("Văn An", QuizGameRules.displayName("Nguyễn Văn An"));
        assertEquals("Hải", QuizGameRules.displayName(" Hải "));
        assertEquals("Cầu thủ", QuizGameRules.displayName(null));
    }

    @Test
    void mockHelpers() {
        assertEquals(List.of("a", "b", "a", "b", "a"), QuizGameRules.spreadTopics(List.of("a", "b"), 5));
        assertTrue(QuizGameRules.spreadTopics(List.of(), 5).isEmpty());
        assertEquals(67, QuizGameRules.percent(2, 3));
        assertEquals(0, QuizGameRules.percent(0, 0));
        assertEquals(List.of(1, -1, 3), QuizGameRules.parseInts("1,x,3"));
    }
}
