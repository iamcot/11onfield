package com.elevenof.backoffice.scoring;

import com.elevenof.backoffice.model.MeasurementSource;
import com.elevenof.backoffice.model.MeasurementStatus;
import com.elevenof.backoffice.model.OfficialState;
import com.elevenof.backoffice.scoring.Reconciler.Current;
import com.elevenof.backoffice.scoring.Reconciler.Decision;
import com.elevenof.backoffice.scoring.Reconciler.Raw;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReconcilerTest {

    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 1, 9, 0);
    private static final BigDecimal TOL = new BigDecimal("0.02");

    private static Raw raw(long id, String v, MeasurementSource s, int sec) {
        return new Raw(id, new BigDecimal(v), MeasurementStatus.OK, s, T.plusSeconds(sec));
    }

    private static Decision run(List<Raw> live, Current cur, Raw newest) {
        return Reconciler.reconcile(live, cur, newest, TOL, new BigDecimal("3.2"), new BigDecimal("8"));
    }

    @Test
    void singleManual() {
        Raw r = raw(1, "4.38", MeasurementSource.MANUAL, 0);
        assertEquals(new Decision(1L, OfficialState.AUTO, null), run(List.of(r), null, r));
    }

    @Test
    void deviceWinsWithinTolerance() {
        Raw m = raw(1, "4.60", MeasurementSource.MANUAL, 0);
        Raw g = raw(2, "4.61", MeasurementSource.DEVICE, 5);
        assertEquals(new Decision(2L, OfficialState.AUTO, null), run(List.of(m, g), null, g));
    }

    @Test
    void mismatchGoesToReview() {
        Raw m = raw(1, "4.38", MeasurementSource.MANUAL, 0);
        Raw g = raw(2, "4.61", MeasurementSource.DEVICE, 5);
        Decision d = run(List.of(m, g), null, m);
        assertEquals(OfficialState.REVIEW, d.state());
        assertEquals(Reconciler.SOURCE_MISMATCH, d.reason());
        assertEquals(2L, d.rawId());
    }

    @Test
    void faultAgainstValueIsMismatch() {
        Raw m = new Raw(1L, null, MeasurementStatus.FAULT, MeasurementSource.MANUAL, T);
        Raw g = raw(2, "4.61", MeasurementSource.DEVICE, 5);
        assertEquals(OfficialState.REVIEW, run(List.of(m, g), null, m).state());
    }

    @Test
    void implausible() {
        Raw r = raw(1, "2.10", MeasurementSource.MANUAL, 0);
        assertEquals(new Decision(1L, OfficialState.REVIEW, Reconciler.IMPLAUSIBLE), run(List.of(r), null, r));
    }

    @Test
    void lockedOnlyReopensForReview() {
        Raw r = raw(1, "4.38", MeasurementSource.MANUAL, 0);
        Raw late = raw(2, "4.20", MeasurementSource.DEVICE, 60);
        Decision d = run(List.of(r, late), new Current(1L, OfficialState.LOCKED), late);
        assertEquals(new Decision(1L, OfficialState.REVIEW, Reconciler.AFTER_LOCK), d);
        assertEquals(new Decision(1L, OfficialState.LOCKED, null), run(List.of(r), new Current(1L, OfficialState.LOCKED), null));
    }

    @Test
    void resolvedStaysUntilNewData() {
        Raw r = raw(1, "4.38", MeasurementSource.MANUAL, 0);
        assertEquals(new Decision(1L, OfficialState.RESOLVED, null), run(List.of(r), new Current(1L, OfficialState.RESOLVED), null));
        Raw n = raw(3, "4.40", MeasurementSource.MANUAL, 9);
        assertEquals(new Decision(1L, OfficialState.REVIEW, Reconciler.AFTER_RESOLVE), run(List.of(r, n), new Current(1L, OfficialState.RESOLVED), n));
    }

    @Test
    void nothingLive() {
        assertNull(run(List.of(), null, null));
    }
}
