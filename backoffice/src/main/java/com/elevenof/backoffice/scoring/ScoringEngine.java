package com.elevenof.backoffice.scoring;

import com.elevenof.backoffice.model.ScoringMethod;
import com.elevenof.backoffice.model.ValueDirection;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Pure scoring rules of the scouting combine, kept free of JPA so they can be tested on plain numbers.
 * <p>
 * Attempts → one value per assessment → a 1–5 level per step → topic points → day total.
 */
public final class ScoringEngine {

    public static final int MAX_LEVEL = 5;
    public static final int MIN_LEVEL = 1;

    private ScoringEngine() {
    }

    /** Inclusive bounds; a null side is open. */
    public record Bound(BigDecimal min, BigDecimal max) {
        public boolean contains(BigDecimal v) {
            return v != null && (min == null || v.compareTo(min) >= 0) && (max == null || v.compareTo(max) <= 0);
        }
    }

    /** One level of a step's scale with a condition per assessment; an assessment without one is not constrained. */
    public record Level(int level, Map<Long, Bound> conditions) {
    }

    public record AssessmentSpec(String title, ValueDirection direction, BigDecimal plausibleMin, BigDecimal plausibleMax) {
    }

    /** The step level and, per assessment, the level its value alone reaches. */
    public record Rating(int level, Map<Long, Integer> perAssessment) {
    }

    // ============= Attempts =============

    /** Folds the attempts that have a value; null when none has. BEST_OF follows the direction. */
    public static BigDecimal aggregate(List<BigDecimal> values, ScoringMethod method, ValueDirection direction) {
        List<BigDecimal> vs = values.stream().filter(Objects::nonNull).toList();
        if (vs.isEmpty()) return null;
        return switch (method) {
            case BEST_OF -> direction == ValueDirection.LOWER
                    ? vs.stream().min(BigDecimal::compareTo).orElseThrow()
                    : vs.stream().max(BigDecimal::compareTo).orElseThrow();
            case SUM -> vs.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            case AVERAGE -> vs.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(vs.size()), 3, RoundingMode.HALF_UP);
        };
    }

    // ============= Levels =============

    /**
     * Each assessment reaches the highest level whose condition holds for its value (Xám when none does); the step gets
     * the lowest of those, so every assessment must reach a level for the step to get it. 112 km/h (Vàng) with 4/5 on
     * target (Vàng) is Vàng; 120 km/h (Xanh) with 4/5 is still Vàng.
     *
     * @return null when an assessment the scale constrains has no value
     */
    public static Rating rate(Map<Long, BigDecimal> values, List<Level> scale) {
        Set<Long> constrained = new TreeSet<>();
        scale.forEach(l -> constrained.addAll(l.conditions().keySet()));
        Map<Long, Integer> per = new LinkedHashMap<>();
        for (Long id : constrained) {
            BigDecimal v = values.get(id);
            if (v == null) return null;
            per.put(id, levelOf(id, v, scale));
        }
        int step = per.values().stream().min(Integer::compare).orElse(MIN_LEVEL);
        return new Rating(step, per);
    }

    private static int levelOf(Long assessmentId, BigDecimal v, List<Level> scale) {
        int best = MIN_LEVEL;
        for (Level l : scale) {
            Bound b = l.conditions().get(assessmentId);
            if (b != null && b.contains(v)) best = Math.max(best, l.level());
        }
        return best;
    }

    /**
     * Checks a scale before it is saved. Per assessment, the bands of levels 2–5 must follow the direction (a better level
     * sits on the better side), must not overlap and must leave no hole between them; Xám takes everything beyond the
     * worst band. When Xám has its own band and the plausible range is set, the bands must cover that range.
     *
     * @return problems in Vietnamese, empty when the scale is fine
     */
    public static List<String> validate(List<Level> scale, Map<Long, AssessmentSpec> specs) {
        List<String> problems = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        for (Level l : scale) {
            if (l.level() < MIN_LEVEL || l.level() > MAX_LEVEL) problems.add("Mức " + l.level() + " không hợp lệ (chỉ 1–5)");
            if (!seen.add(l.level())) problems.add("Mức " + l.level() + " bị lặp");
        }
        for (Map.Entry<Long, AssessmentSpec> e : specs.entrySet()) {
            Long id = e.getKey();
            AssessmentSpec spec = e.getValue();
            String name = spec.title();
            List<Map.Entry<Integer, Bound>> bands = new ArrayList<>();
            for (Level l : scale) {
                Bound b = l.conditions().get(id);
                if (b == null) continue;
                if (b.min() == null && b.max() == null) continue;
                if (b.min() != null && b.max() != null && b.min().compareTo(b.max()) > 0) {
                    problems.add(name + ": mức " + l.level() + " có cận dưới lớn hơn cận trên");
                    continue;
                }
                bands.add(Map.entry(l.level(), b));
            }
            if (bands.isEmpty()) continue;
            boolean greyHasBand = bands.stream().anyMatch(b -> b.getKey() == MIN_LEVEL);
            // Worst level first along the "better" direction, so for HIGHER the values go up and for LOWER they go down.
            bands.sort(Map.Entry.comparingByKey());
            boolean higher = spec.direction() != ValueDirection.LOWER;
            for (int i = 0; i + 1 < bands.size(); i++) {
                int worseLevel = bands.get(i).getKey();
                int betterLevel = bands.get(i + 1).getKey();
                Bound worse = bands.get(i).getValue();
                Bound better = bands.get(i + 1).getValue();
                // For HIGHER: worse.max meets better.min. For LOWER: better.max meets worse.min.
                BigDecimal low = higher ? worse.max() : better.max();
                BigDecimal high = higher ? better.min() : worse.min();
                if (low == null || high == null) {
                    problems.add(name + ": mức " + betterLevel + " và mức " + worseLevel + " chồng nhau hoặc ngược chiều");
                    continue;
                }
                int cmp = high.compareTo(low);
                if (cmp < 0) {
                    problems.add(name + ": mức " + worseLevel + " và mức " + betterLevel + " chồng nhau ở " + fmt(high) + "–" + fmt(low));
                } else if (high.subtract(low).compareTo(step(low, high)) > 0) {
                    problems.add(name + ": " + fmt(low) + "–" + fmt(high) + " chưa thuộc mức nào (giữa mức "
                            + worseLevel + " và mức " + betterLevel + ")");
                }
                if (!followsDirection(worse, better, higher)) {
                    problems.add(name + ": mức " + betterLevel + " phải tốt hơn mức " + worseLevel + " theo chiều "
                            + (higher ? "cao hơn tốt" : "thấp hơn tốt"));
                }
            }
            if (greyHasBand && spec.plausibleMin() != null && spec.plausibleMax() != null) {
                BigDecimal lo = null;
                BigDecimal hi = null;
                boolean openLo = false;
                boolean openHi = false;
                for (Map.Entry<Integer, Bound> b : bands) {
                    if (b.getValue().min() == null) openLo = true;
                    else lo = lo == null ? b.getValue().min() : lo.min(b.getValue().min());
                    if (b.getValue().max() == null) openHi = true;
                    else hi = hi == null ? b.getValue().max() : hi.max(b.getValue().max());
                }
                if (!openLo && lo != null && lo.compareTo(spec.plausibleMin()) > 0) {
                    problems.add(name + ": " + fmt(spec.plausibleMin()) + "–" + fmt(lo) + " chưa thuộc mức nào");
                }
                if (!openHi && hi != null && hi.compareTo(spec.plausibleMax()) < 0) {
                    problems.add(name + ": " + fmt(hi) + "–" + fmt(spec.plausibleMax()) + " chưa thuộc mức nào");
                }
            }
        }
        return problems;
    }

    private static boolean followsDirection(Bound worse, Bound better, boolean higher) {
        BigDecimal w = mid(worse);
        BigDecimal b = mid(better);
        if (w == null || b == null) return true;
        return higher ? b.compareTo(w) >= 0 : b.compareTo(w) <= 0;
    }

    private static BigDecimal mid(Bound b) {
        if (b.min() != null && b.max() != null) return b.min().add(b.max()).divide(BigDecimal.valueOf(2), 6, RoundingMode.HALF_UP);
        return b.min() != null ? b.min() : b.max();
    }

    /** Smallest step the two bounds are written with: 4.70 and 4.71 touch, 60 and 62 leave 61 out. */
    private static BigDecimal step(BigDecimal a, BigDecimal b) {
        int scale = Math.max(Math.max(a.stripTrailingZeros().scale(), b.stripTrailingZeros().scale()), 0);
        return BigDecimal.ONE.movePointLeft(scale);
    }

    private static String fmt(BigDecimal v) {
        return v.stripTrailingZeros().toPlainString().replace('.', ',');
    }

    // ============= Topics and day =============

    /**
     * Points of a topic: maxPoints × Σ levels / (5 × steps). Kỹ thuật 20 with 3 + 4 + 5 gives 16.
     *
     * @param levels one entry per step the participant takes, null when that step has no level yet
     * @return null when a level is missing or there is no step
     */
    public static BigDecimal topicPoints(BigDecimal maxPoints, List<Integer> levels) {
        if (levels.isEmpty() || levels.stream().anyMatch(Objects::isNull)) return null;
        int sum = levels.stream().mapToInt(Integer::intValue).sum();
        return maxPoints.multiply(BigDecimal.valueOf(sum))
                .divide(BigDecimal.valueOf((long) MAX_LEVEL * levels.size()), 2, RoundingMode.HALF_UP);
    }

    /** Sum of the topics that have points; complete only when every topic has. */
    public record DayTotal(BigDecimal points, boolean complete) {
    }

    public static DayTotal dayTotal(Collection<BigDecimal> topicPoints) {
        BigDecimal sum = BigDecimal.ZERO;
        boolean complete = !topicPoints.isEmpty();
        for (BigDecimal p : topicPoints) {
            if (p == null) complete = false;
            else sum = sum.add(p);
        }
        return new DayTotal(sum.setScale(2, RoundingMode.HALF_UP), complete);
    }

    /**
     * Whether a value is within the tolerance of a band edge it could fall either side of, so a person may want to look.
     */
    public static boolean nearBoundary(BigDecimal value, BigDecimal tolerance, Long assessmentId, List<Level> scale) {
        if (value == null || tolerance == null || tolerance.signum() <= 0) return false;
        for (Level l : scale) {
            Bound b = l.conditions().get(assessmentId);
            if (b == null) continue;
            if (b.min() != null && value.subtract(b.min()).abs().compareTo(tolerance) <= 0) return true;
            if (b.max() != null && value.subtract(b.max()).abs().compareTo(tolerance) <= 0) return true;
        }
        return false;
    }
}
