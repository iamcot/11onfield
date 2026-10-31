package com.elevenof.backoffice.model;

public enum MeasurementStatus {
    /** A measured value. */
    OK,
    /** The attempt counts but failed (knocked a cone, slipped): no value. */
    FAULT,
    /** Did not start. */
    DNS
}
