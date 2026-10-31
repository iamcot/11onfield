package com.elevenof.backoffice.model;

/**
 * Groups of player data with their own visibility. {@code locked} groups can never be raised above their default by
 * an admin, {@code ownerCanHide} is the default for whether the player may lower the level, and {@code gated} groups
 * count as PRIVATE until the round's results are released.
 */
public enum DataGroup {
    IDENTITY(VisibilityLevel.PUBLIC, false, false, false),
    BODY_BASIC(VisibilityLevel.PUBLIC, true, false, false),
    BODY_COMPOSITION(VisibilityLevel.PRIVATE, false, false, false),
    MEDICAL(VisibilityLevel.HIDDEN, false, true, false),
    TEST_RESULTS(VisibilityLevel.PRIVATE, true, false, true),
    COMBINE_HEX(VisibilityLevel.PUBLIC, false, false, true),
    SCORE_TOTAL(VisibilityLevel.PUBLIC, false, false, true),
    /** Rank by score: only the admin sees it, it never goes into a public payload. */
    RANK(VisibilityLevel.HIDDEN, false, true, false),
    JUDGE_NOTES(VisibilityLevel.HIDDEN, false, false, false),
    MATCH_STATS(VisibilityLevel.PRIVATE, true, false, false),
    GREEN_CARD(VisibilityLevel.PUBLIC, false, false, false),
    DISCIPLINE(VisibilityLevel.HIDDEN, false, false, false);

    public final VisibilityLevel defaultLevel;
    public final boolean ownerCanHide;
    public final boolean locked;
    public final boolean gated;

    DataGroup(VisibilityLevel defaultLevel, boolean ownerCanHide, boolean locked, boolean gated) {
        this.defaultLevel = defaultLevel;
        this.ownerCanHide = ownerCanHide;
        this.locked = locked;
        this.gated = gated;
    }
}
