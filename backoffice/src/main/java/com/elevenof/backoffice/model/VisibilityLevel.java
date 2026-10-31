package com.elevenof.backoffice.model;

/** Ordered from the most to the least restrictive. */
public enum VisibilityLevel {
    HIDDEN,   // staff only
    PRIVATE,  // owner + staff
    PUBLIC;   // everyone

    public VisibilityLevel min(VisibilityLevel other) {
        return compareTo(other) <= 0 ? this : other;
    }
}
