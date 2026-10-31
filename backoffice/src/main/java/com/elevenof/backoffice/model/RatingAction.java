package com.elevenof.backoffice.model;

/** What happens when a participant lands on a rating level. */
public enum RatingAction {
    NONE,
    /** Mark the participant Low Performance for review. */
    FLAG,
    ELIMINATE
}
