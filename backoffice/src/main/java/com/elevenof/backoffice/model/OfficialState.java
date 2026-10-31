package com.elevenof.backoffice.model;

/** State of the official value of one attempt. */
public enum OfficialState {
    /** Picked by the rules, no one needs to look. */
    AUTO,
    /** Waiting for a person to pick the value. */
    REVIEW,
    /** Picked by a person. */
    RESOLVED,
    /** The step is locked; new raw records only send it back to REVIEW. */
    LOCKED
}
