package com.elevenof.backoffice.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Scouting Combine result on a player profile. Each block belongs to one data group and is left out (not serialized)
 * when the viewer may not see that group.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CombineDTO {
    private String stageTitle;
    /** Label of where the numbers come from, e.g. "Scouting Combine · Vòng khu vực HCM". */
    private String source;

    /** COMBINE_HEX: six axes 0-99, an axis without data is left out. */
    private List<Axis> hex;

    /** SCORE_TOTAL: total, grade and the score of each group. */
    private Double total;
    private Double totalMax;
    private String grade;
    private List<GroupScore> groups;

    /** TEST_RESULTS: raw measurement and colour of each test. */
    private List<TestRow> tests;

    /** Groups the viewer sees only because it is their own profile ("Chỉ bạn thấy"). */
    private List<String> ownerOnly;

    @Data
    @Builder
    public static class Axis {
        private String key;
        private int value;
    }

    @Data
    @Builder
    public static class GroupScore {
        private String key;
        private String label;
        private double score;
        private double max;
    }

    @Data
    @Builder
    public static class TestRow {
        private String key;
        private String name;
        private String value;
        /** 1 (grey) to 5 (blue). */
        private int level;
        /** Difference with the average of the same position, positive = better. */
        private Double vsAverage;
    }
}
