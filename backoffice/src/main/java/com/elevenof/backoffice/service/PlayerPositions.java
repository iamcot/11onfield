package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Player;

import java.util.List;
import java.util.Objects;

/**
 * A player has one main position ({@code players.positions}) and at most one secondary
 * ({@code players.secondary_position}). Codes: striker, midfielder, defender, goalkeeper.
 * Older clients may still send several positions: the first is the main one, the second becomes
 * the secondary when none is given, the rest is dropped.
 */
public final class PlayerPositions {
    public static final List<String> CODES = List.of("striker", "midfielder", "defender", "goalkeeper");

    private PlayerPositions() {}

    /** Writes what the request carries; {@code null} means "not sent, leave it". */
    public static void apply(Player p, List<String> positions, String secondary) {
        if (positions != null) {
            List<String> codes = positions.stream().filter(Objects::nonNull)
                    .flatMap(s -> java.util.Arrays.stream(s.split(","))).map(String::trim)
                    .filter(s -> !s.isEmpty()).distinct().toList();
            p.setPositions(codes.isEmpty() ? null : codes.get(0));
            if (secondary == null && codes.size() > 1) secondary = codes.get(1);
        }
        if (secondary != null) {
            String s = secondary.trim();
            p.setSecondaryPosition(s.isEmpty() || s.equals(p.getPositions()) ? null : s);
        }
    }
}
