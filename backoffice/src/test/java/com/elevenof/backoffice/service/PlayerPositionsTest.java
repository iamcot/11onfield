package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Player;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PlayerPositionsTest {
    @Test
    void severalPositionsKeepMainAndSecondary() {
        Player p = new Player();
        PlayerPositions.apply(p, List.of("striker", "midfielder", "defender"), null);
        assertEquals("striker", p.getPositions());
        assertEquals("midfielder", p.getSecondaryPosition());
    }

    @Test
    void explicitSecondaryWinsAndSameAsMainIsDropped() {
        Player p = new Player();
        PlayerPositions.apply(p, List.of("striker,midfielder"), "defender");
        assertEquals("striker", p.getPositions());
        assertEquals("defender", p.getSecondaryPosition());
        PlayerPositions.apply(p, List.of("defender"), "defender");
        assertEquals("defender", p.getPositions());
        assertNull(p.getSecondaryPosition());
    }

    @Test
    void nothingSentLeavesValues() {
        Player p = new Player();
        p.setPositions("goalkeeper");
        p.setSecondaryPosition("defender");
        PlayerPositions.apply(p, null, null);
        assertEquals("goalkeeper", p.getPositions());
        assertEquals("defender", p.getSecondaryPosition());
    }
}
