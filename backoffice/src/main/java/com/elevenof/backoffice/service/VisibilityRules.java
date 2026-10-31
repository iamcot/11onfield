package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.DataGroup;
import com.elevenof.backoffice.model.VisibilityLevel;
import com.elevenof.backoffice.model.VisibilityPolicy;

/** The visibility rules without any database access. */
public final class VisibilityRules {

    private VisibilityRules() {}

    /** What one data group is worth for one profile right now. */
    public record Effective(DataGroup group, VisibilityLevel adminMax, boolean ownerCanHide, VisibilityLevel mine, VisibilityLevel level) {}

    public enum Viewer { STAFF, OWNER, PUBLIC }

    /**
     * @param policy   the admin's row for the group, or null for the built-in default
     * @param released whether the round's results are already public
     * @param mine     the player's own choice, or null
     */
    public static Effective resolve(DataGroup group, VisibilityPolicy policy, boolean released, VisibilityLevel mine) {
        VisibilityLevel max = policy != null && policy.getMaxLevel() != null ? policy.getMaxLevel() : group.defaultLevel;
        // a locked group never goes above its default, whatever the admin saved
        if (group.locked) max = max.min(group.defaultLevel);
        boolean ownerCanHide = group.ownerCanHide && (policy == null || !Boolean.FALSE.equals(policy.getOwnerCanHide()));
        VisibilityLevel level = max;
        if (group.gated && !released) level = level.min(VisibilityLevel.PRIVATE);
        if (mine != null && ownerCanHide) level = level.min(mine);
        return new Effective(group, max, ownerCanHide, ownerCanHide ? mine : null, level);
    }

    public static boolean canSee(Effective e, Viewer viewer) {
        return switch (viewer) {
            case STAFF -> true;
            case OWNER -> e.level().compareTo(VisibilityLevel.PRIVATE) >= 0;
            case PUBLIC -> e.level() == VisibilityLevel.PUBLIC;
        };
    }
}
