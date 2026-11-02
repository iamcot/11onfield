package com.elevenof.backoffice.service.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class QuizBankRulesTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static JsonNode json(String s) throws Exception {
        return JSON.readTree(s);
    }

    private static QuizBankRules.Candidate cand(String body, List<String> options, int correct) {
        return new QuizBankRules.Candidate(body, options, correct, "vì luật", null);
    }

    @Test
    void normalizeDropsAccentsCaseAndPunctuation() {
        assertEquals("viet vi la gi", QuizBankRules.normalize("  Việt vị là gì?! "));
        assertEquals("doc tinh huong", QuizBankRules.normalize("Đọc tình huống"));
        assertEquals("doc_tinh_huong", QuizBankRules.topicKeyFrom("Đọc tình huống"));
        assertTrue(QuizBankRules.validTopicKey("laws"));
        assertFalse(QuizBankRules.validTopicKey("Laws"));
    }

    @Test
    void duplicatesBySameTextOrNearlyTheSameWords() {
        String a = "Cầu thủ việt vị khi nào trong luật bóng đá?";
        Set<String> hashes = Set.of(QuizBankRules.hash(a));
        assertTrue(QuizBankRules.isDuplicate("cau thu viet vi khi nao trong luat bong da", hashes, List.of()));
        assertTrue(QuizBankRules.isDuplicate("Cầu thủ việt vị khi nào trong luật bóng đá hiện nay?", Set.of(), List.of(a)));
        assertFalse(QuizBankRules.isDuplicate("Thẻ đỏ gián tiếp là gì?", hashes, List.of(a)));
    }

    @Test
    void problemChecksLengthOptionsAndCorrect() {
        List<String> ok = List.of("A", "B", "C", "D");
        assertNull(QuizBankRules.problem(cand("Một trận đấu có bao nhiêu hiệp?", ok, 1)));
        assertNotNull(QuizBankRules.problem(cand("Ngắn", ok, 1)));
        assertNotNull(QuizBankRules.problem(cand("Một trận đấu có bao nhiêu hiệp?", List.of("A", "B", "C"), 1)));
        assertNotNull(QuizBankRules.problem(cand("Một trận đấu có bao nhiêu hiệp?", List.of("A", "a", "C", "D"), 1)), "same option ignoring case");
        assertNotNull(QuizBankRules.problem(cand("Một trận đấu có bao nhiêu hiệp?", ok, 4)));
        assertNotNull(QuizBankRules.problem(null));
    }

    @Test
    void parseQuestionsCountsInvalidAndNeedsADiagramWhenAsked() throws Exception {
        JsonNode root = json("""
                {"questions":[
                  {"body":"Bạn là hậu vệ trái, nên làm gì?","options":["Lùi","Áp sát","Phạm lỗi","Đứng yên"],"correct":1,"explanation":"x",
                   "diagram":{"players":[{"team":"own","x":20,"y":80,"me":true},{"team":"opp","x":30,"y":70}],"ball":{"x":31,"y":70}}},
                  {"body":"Câu không có sơ đồ đây nhé?","options":["A","B","C","D"],"correct":0,"explanation":"x"},
                  {"body":"Thiếu đáp án nên không hợp lệ","options":["A","B"],"correct":0}
                ]}""");
        int[] invalid = {0};
        List<QuizBankRules.Candidate> withDiagram = QuizBankRules.parseQuestions(root, true, invalid);
        assertEquals(1, withDiagram.size());
        assertNotNull(withDiagram.get(0).diagram());
        assertEquals(2, invalid[0]);

        int[] invalid2 = {0};
        assertEquals(2, QuizBankRules.parseQuestions(root, false, invalid2).size());
        assertEquals(1, invalid2[0]);
        assertTrue(QuizBankRules.parseQuestions(null, false, null).isEmpty());
    }

    @Test
    void parseAnswersKeepsOnlyValidChoices() throws Exception {
        Map<Integer, Integer> a = QuizBankRules.parseAnswers(json("{\"answers\":[{\"index\":0,\"choice\":2},{\"index\":1,\"choice\":7},{\"index\":-1,\"choice\":0}]}"));
        assertEquals(Map.of(0, 2), a);
    }

    @Test
    void shuffleKeepsTheRightAnswer() {
        QuizBankRules.Candidate c = cand("Một trận đấu có bao nhiêu hiệp?", List.of("2 hiệp", "1", "3", "4"), 0);
        for (int seed = 0; seed < 20; seed++) {
            QuizBankRules.Candidate s = QuizBankRules.shuffled(c, new Random(seed));
            assertEquals("2 hiệp", s.options().get(s.correct()));
            assertEquals(new HashSet<>(c.options()), new HashSet<>(s.options()));
        }
    }

    @Test
    void verdictFromTheBlindAnswer() {
        assertEquals(new QuizBankRules.Verdict("pending", 1, null), QuizBankRules.verdict(2, 2));
        QuizBankRules.Verdict wrong = QuizBankRules.verdict(1, 2);
        assertEquals("hidden", wrong.status());
        assertEquals(-1, wrong.verified());
        assertTrue(wrong.note().contains("B"));
        assertEquals(0, QuizBankRules.verdict(null, 2).verified());
        assertEquals("pending", QuizBankRules.verdict(null, 2).status());
    }

    @Test
    void shortfallCountsPending() {
        assertEquals(10, QuizBankRules.shortfall(15, 5, 30));
        assertEquals(0, QuizBankRules.shortfall(40, 0, 30));
    }
}
