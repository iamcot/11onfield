package com.elevenof.backoffice.exception;

import java.util.List;

/** A rating scale that would leave holes or overlaps; carries every problem found. */
public class ScaleInvalidException extends IllegalArgumentException {

    private final List<String> problems;

    public ScaleInvalidException(List<String> problems) {
        super("Thang điểm chưa hợp lệ: " + String.join("; ", problems));
        this.problems = List.copyOf(problems);
    }

    public List<String> getProblems() {
        return problems;
    }
}
