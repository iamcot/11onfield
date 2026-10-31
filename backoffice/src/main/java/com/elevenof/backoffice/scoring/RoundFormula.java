package com.elevenof.backoffice.scoring;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * A round's formula (stored as JSON in score_formulas.definition) and the pure rules that turn component points into a
 * round total, a class and an order.
 * <p>
 * Combine round 1: 0.3 × Ngày 1 (100) + GPS &amp; AI (20) + BHL (40) + Tư duy &amp; truyền thông (10).
 */
public record RoundFormula(List<Component> components, Map<String, String> topicManual, List<ClassBand> classes,
                           List<String> tieBreak) {

    public static final String DAY = "DAY";
    public static final String MANUAL = "MANUAL";
    /** Tie-break key: fewer discipline flags first. */
    public static final String DISCIPLINE = "DISCIPLINE";

    /**
     * DAY: weight × the day's total (dayNumber). MANUAL: the manual score with this key, capped at max.
     */
    public record Component(String key, String label, String type, Integer dayNumber, BigDecimal weight, BigDecimal max) {
    }

    public record ClassBand(BigDecimal min, String label) {
    }

    /**
     * The formula used until an admin saves one: the round score is the average of its days, each day out of 100, so
     * the round is out of 100 too. What the coaches score by hand is part of a day (score groups "HLV chấm tay").
     */
    public static RoundFormula daysAverage(List<Integer> dayNumbers) {
        List<Integer> days = dayNumbers == null || dayNumbers.isEmpty() ? List.of(1) : dayNumbers;
        BigDecimal weight = BigDecimal.ONE.divide(BigDecimal.valueOf(days.size()), 4, RoundingMode.HALF_UP);
        List<Component> components = new ArrayList<>();
        for (Integer d : days) components.add(new Component("DAY" + d, "Ngày " + d, DAY, d, weight, null));
        return new RoundFormula(components, Map.of(), combineRound1().classes(), List.of(DISCIPLINE));
    }

    /** The round 1 formula of the first plan (day 1 at 30% plus four hand scores). No longer the default. */
    public static RoundFormula combineRound1() {
        return new RoundFormula(
                List.of(new Component("DAY1", "Ngày 1", DAY, 1, new BigDecimal("0.3"), new BigDecimal("30")),
                        new Component("GPS_AI", "GPS & AI", MANUAL, null, null, new BigDecimal("20")),
                        new Component("BHL", "BHL", MANUAL, null, null, new BigDecimal("40")),
                        new Component("MIND_MEDIA", "Tư duy & truyền thông", MANUAL, null, null, new BigDecimal("10"))),
                Map.of("DUEL", "TACTICAL_7V7"),
                List.of(new ClassBand(new BigDecimal("90"), "Elite Prospect"),
                        new ClassBand(new BigDecimal("80"), "Professional Potential"),
                        new ClassBand(new BigDecimal("70"), "Development Squad"),
                        new ClassBand(new BigDecimal("60"), "Academy Level"),
                        new ClassBand(BigDecimal.ZERO, "Not Selected")),
                List.of("MIND", DISCIPLINE, "FITNESS"));
    }

    /** Problems in Vietnamese, empty when the formula can be saved. */
    public List<String> validate() {
        List<String> problems = new ArrayList<>();
        if (components == null || components.isEmpty()) problems.add("Công thức cần ít nhất một thành phần");
        Set<String> keys = new HashSet<>();
        for (Component c : components == null ? List.<Component>of() : components) {
            if (c.key() == null || c.key().isBlank()) problems.add("Thành phần thiếu mã");
            else if (!keys.add(c.key())) problems.add("Mã thành phần bị lặp: " + c.key());
            if (DAY.equals(c.type())) {
                if (c.dayNumber() == null) problems.add(c.key() + ": thiếu ngày thi");
                if (c.weight() == null || c.weight().signum() <= 0) problems.add(c.key() + ": hệ số phải lớn hơn 0");
            } else if (MANUAL.equals(c.type())) {
                if (c.max() == null || c.max().signum() <= 0) problems.add(c.key() + ": điểm tối đa phải lớn hơn 0");
            } else {
                problems.add(c.key() + ": loại phải là DAY hoặc MANUAL");
            }
        }
        return problems;
    }

    /** Highest possible total of the round. */
    public BigDecimal maxTotal() {
        BigDecimal sum = BigDecimal.ZERO;
        for (Component c : components) {
            sum = sum.add(DAY.equals(c.type()) ? c.weight().multiply(BigDecimal.valueOf(100)) : c.max());
        }
        return sum.setScale(2, RoundingMode.HALF_UP);
    }

    public record Total(BigDecimal total, boolean complete, String classification) {
    }

    /**
     * @param points per component key, null when that component has no points yet
     */
    public Total total(Map<String, BigDecimal> points) {
        BigDecimal sum = BigDecimal.ZERO;
        boolean complete = true;
        for (Component c : components) {
            BigDecimal p = points.get(c.key());
            if (p == null) complete = false;
            else sum = sum.add(p);
        }
        sum = sum.setScale(2, RoundingMode.HALF_UP);
        return new Total(sum, complete, complete ? classify(sum) : null);
    }

    /** Points a component gets from its raw input: the weighted day total, or the manual score capped at max. */
    public static BigDecimal componentPoints(Component c, BigDecimal raw) {
        if (raw == null) return null;
        BigDecimal p = DAY.equals(c.type()) ? raw.multiply(c.weight()) : raw.min(c.max()).max(BigDecimal.ZERO);
        return p.setScale(2, RoundingMode.HALF_UP);
    }

    public String classify(BigDecimal total) {
        if (classes == null) return null;
        return classes.stream().sorted(Comparator.comparing(ClassBand::min).reversed())
                .filter(b -> total.compareTo(b.min()) >= 0).map(ClassBand::label).findFirst().orElse(null);
    }

    /** What the ranking compares beyond the total. */
    public record Entry(Long participantId, BigDecimal total, boolean complete, Map<String, BigDecimal> topicPoints,
                        long disciplineCount) {
    }

    /**
     * Complete totals first, then higher total, then the tie-break keys in order (a topic: more points first;
     * DISCIPLINE: fewer flags first), then participant id so the order is stable.
     */
    public Comparator<Entry> order() {
        Comparator<Entry> c = Comparator.comparing(Entry::complete).reversed()
                .thenComparing(Entry::total, Comparator.nullsLast(Comparator.reverseOrder()));
        for (String key : tieBreak == null ? List.<String>of() : tieBreak) {
            if (DISCIPLINE.equals(key)) {
                c = c.thenComparingLong(Entry::disciplineCount);
            } else {
                c = c.thenComparing(e -> e.topicPoints().get(key), Comparator.nullsLast(Comparator.reverseOrder()));
            }
        }
        return c.thenComparing(Entry::participantId);
    }

    /** Whether two entries tie on everything the order compares except the id. */
    public boolean tied(Entry a, Entry b) {
        Comparator<Entry> c = order();
        Entry b2 = new Entry(a.participantId(), b.total(), b.complete(), b.topicPoints(), b.disciplineCount());
        return c.compare(a, b2) == 0;
    }
}
