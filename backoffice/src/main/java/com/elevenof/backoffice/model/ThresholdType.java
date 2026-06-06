package com.elevenof.backoffice.model;

/**
 * Threshold type for rating scale levels
 */
public enum ThresholdType {
    /**
     * Exact threshold - requires score to be greater than or equal to a specific value
     * Example: Level 5 requires score ≥ 90
     * Uses: threshold_value field
     */
    EXACT,

    /**
     * Range threshold - requires score to fall within a specific range (inclusive)
     * Example: Level 4 requires score between 75-89
     * Uses: range_min and range_max fields
     */
    RANGE
}
