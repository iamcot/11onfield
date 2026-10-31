package com.elevenof.backoffice.scoring;

import com.elevenof.backoffice.model.MeasurementSource;
import com.elevenof.backoffice.model.MeasurementStatus;
import com.elevenof.backoffice.model.OfficialState;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Picks the official value of one attempt from its live raw records (those no later record supersedes).
 * <ul>
 *   <li>One source, or several within the tolerance: AUTO, the best source wins (device, file, video, manual), the latest
 *   record within a source.</li>
 *   <li>Sources further apart than the tolerance: REVIEW, SOURCE_MISMATCH.</li>
 *   <li>Picked value outside the plausible range: REVIEW, IMPLAUSIBLE.</li>
 *   <li>Already RESOLVED or LOCKED: the picked record stays; a newer record only sends it back to REVIEW.</li>
 * </ul>
 */
public final class Reconciler {

    public static final String SOURCE_MISMATCH = "SOURCE_MISMATCH";
    public static final String IMPLAUSIBLE = "IMPLAUSIBLE";
    public static final String AFTER_LOCK = "AFTER_LOCK";
    public static final String AFTER_RESOLVE = "AFTER_RESOLVE";
    public static final String NEAR_BOUNDARY = "NEAR_BOUNDARY";

    private Reconciler() {
    }

    public record Raw(Long id, BigDecimal value, MeasurementStatus status, MeasurementSource source, LocalDateTime receivedAt) {
    }

    /** The current official row, or null when the attempt has none yet. */
    public record Current(Long rawId, OfficialState state) {
    }

    public record Decision(Long rawId, OfficialState state, String reason) {
    }

    /**
     * @param live raw records of the attempt that no other record supersedes
     * @param newest the record that triggered this run, or null for a plain recompute
     */
    public static Decision reconcile(List<Raw> live, Current current, Raw newest,
                                     BigDecimal tolerance, BigDecimal plausibleMin, BigDecimal plausibleMax) {
        if (current != null && (current.state() == OfficialState.LOCKED || current.state() == OfficialState.RESOLVED)) {
            if (newest == null || newest.id().equals(current.rawId())) return new Decision(current.rawId(), current.state(), null);
            String reason = current.state() == OfficialState.LOCKED ? AFTER_LOCK : AFTER_RESOLVE;
            return new Decision(current.rawId(), OfficialState.REVIEW, reason);
        }
        if (live.isEmpty()) return null;

        Comparator<Raw> best = Comparator.comparingInt((Raw r) -> r.source().ordinal())
                .thenComparing(Raw::receivedAt, Comparator.reverseOrder())
                .thenComparing(Raw::id, Comparator.reverseOrder());
        Raw picked = live.stream().sorted(best).findFirst().orElseThrow();

        List<BigDecimal> values = live.stream()
                .filter(r -> r.status() == MeasurementStatus.OK && r.value() != null)
                .map(Raw::value).toList();
        boolean statusesDisagree = live.stream().map(Raw::status).distinct().count() > 1;
        if (statusesDisagree || spread(values).compareTo(tolerance != null ? tolerance : BigDecimal.ZERO) > 0) {
            return new Decision(picked.id(), OfficialState.REVIEW, SOURCE_MISMATCH);
        }
        if (picked.status() == MeasurementStatus.OK && picked.value() != null
                && ((plausibleMin != null && picked.value().compareTo(plausibleMin) < 0)
                || (plausibleMax != null && picked.value().compareTo(plausibleMax) > 0))) {
            return new Decision(picked.id(), OfficialState.REVIEW, IMPLAUSIBLE);
        }
        return new Decision(picked.id(), OfficialState.AUTO, null);
    }

    private static BigDecimal spread(List<BigDecimal> values) {
        if (values.size() < 2) return BigDecimal.ZERO;
        BigDecimal min = values.stream().min(BigDecimal::compareTo).orElseThrow();
        BigDecimal max = values.stream().max(BigDecimal::compareTo).orElseThrow();
        return max.subtract(min);
    }
}
