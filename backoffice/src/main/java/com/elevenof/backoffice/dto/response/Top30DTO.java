package com.elevenof.backoffice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/** Public Top 30 list: no rank, no score, nothing that orders the players by result. */
@Data
@Builder
public class Top30DTO {
    /** False until the selection is finalized; the page hides the tab then. */
    private boolean published;
    private List<Entry> players;

    @Data
    @Builder
    public static class Entry {
        private String userid;
        private String fullName;
        private String avatar;
        /** First position of the player: goalkeeper, defender, centerback, midfielder, striker. */
        private String position;
    }
}
