package com.elevenof.backoffice.model;

/** Where a raw measurement came from, best first when two sources disagree within tolerance. */
public enum MeasurementSource {
    DEVICE,
    FILE,
    VIDEO,
    MANUAL
}
