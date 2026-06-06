package com.elevenof.backoffice.model;

/**
 * Scoring method for aggregating multiple test attempts
 */
public enum ScoringMethod {
    /**
     * Take the best (highest or lowest depending on context) result from all attempts
     * Example: For 3 sprint attempts [12.5s, 11.8s, 12.3s], final score = 11.8s (fastest)
     */
    BEST_OF,

    /**
     * Sum all attempt results together
     * Example: For 2 repetition tests [45 reps, 50 reps], final score = 95 reps
     */
    SUM,

    /**
     * Calculate the average (mean) of all attempts
     * Example: For 3 skill tests [80, 85, 90], final score = 85
     */
    AVERAGE
}
