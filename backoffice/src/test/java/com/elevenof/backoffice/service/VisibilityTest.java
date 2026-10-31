package com.elevenof.backoffice.service;

import com.elevenof.backoffice.dto.response.CombineDTO;
import com.elevenof.backoffice.model.DataGroup;
import com.elevenof.backoffice.model.VisibilityLevel;
import com.elevenof.backoffice.model.VisibilityPolicy;
import com.elevenof.backoffice.service.VisibilityRules.Effective;
import com.elevenof.backoffice.service.VisibilityRules.Viewer;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VisibilityTest {

    private static VisibilityPolicy policy(DataGroup g, VisibilityLevel max, boolean hide) {
        return VisibilityPolicy.builder().dataGroup(g).maxLevel(max).ownerCanHide(hide).build();
    }

    @Test
    void gatedGroupsStayPrivateUntilReleased() {
        Effective before = VisibilityRules.resolve(DataGroup.COMBINE_HEX, null, false, null);
        assertEquals(VisibilityLevel.PRIVATE, before.level());
        assertFalse(VisibilityRules.canSee(before, Viewer.PUBLIC));
        assertTrue(VisibilityRules.canSee(before, Viewer.OWNER));

        Effective after = VisibilityRules.resolve(DataGroup.COMBINE_HEX, null, true, null);
        assertTrue(VisibilityRules.canSee(after, Viewer.PUBLIC));
    }

    @Test
    void rankAndMedicalCanNeverBeRaised() {
        for (DataGroup g : new DataGroup[]{DataGroup.RANK, DataGroup.MEDICAL}) {
            Effective e = VisibilityRules.resolve(g, policy(g, VisibilityLevel.PUBLIC, true), true, null);
            assertEquals(VisibilityLevel.HIDDEN, e.level());
            assertFalse(VisibilityRules.canSee(e, Viewer.OWNER));
            assertFalse(VisibilityRules.canSee(e, Viewer.PUBLIC));
            assertTrue(VisibilityRules.canSee(e, Viewer.STAFF));
        }
    }

    @Test
    void playerCanOnlyLowerWhereAllowed() {
        Effective hidden = VisibilityRules.resolve(DataGroup.BODY_BASIC, null, true, VisibilityLevel.PRIVATE);
        assertEquals(VisibilityLevel.PRIVATE, hidden.level());
        assertFalse(VisibilityRules.canSee(hidden, Viewer.PUBLIC));

        // identity cannot be hidden by the player
        Effective identity = VisibilityRules.resolve(DataGroup.IDENTITY, null, true, VisibilityLevel.HIDDEN);
        assertEquals(VisibilityLevel.PUBLIC, identity.level());

        // the admin turning the switch off wins over an old choice of the player
        Effective locked = VisibilityRules.resolve(DataGroup.BODY_BASIC, policy(DataGroup.BODY_BASIC, VisibilityLevel.PUBLIC, false), true, VisibilityLevel.HIDDEN);
        assertEquals(VisibilityLevel.PUBLIC, locked.level());
    }

    @Test
    void playerChoiceNeverRaisesAboveTheAdminMax() {
        Effective e = VisibilityRules.resolve(DataGroup.TEST_RESULTS, null, true, VisibilityLevel.PUBLIC);
        assertEquals(VisibilityLevel.PRIVATE, e.level());
    }

    private static VisibilityService.Access access(Viewer viewer, boolean released, Map<DataGroup, VisibilityLevel> mine) {
        Map<DataGroup, Effective> groups = new EnumMap<>(DataGroup.class);
        for (DataGroup g : DataGroup.values()) groups.put(g, VisibilityRules.resolve(g, null, released, mine.get(g)));
        return new VisibilityService.Access(viewer, groups);
    }

    private static CombineDTO full() {
        return CombineDTO.builder().stageTitle("Vòng 1").source("Scouting Combine")
            .hex(List.of(CombineDTO.Axis.builder().key("pac").value(80).build()))
            .total(70.0).totalMax(100.0).grade("B")
            .groups(List.of(CombineDTO.GroupScore.builder().key("fit").label("Thể lực").score(8).max(10).build()))
            .tests(List.of(CombineDTO.TestRow.builder().key("sprint").name("Sprint").value("4,2 s").level(4).build()))
            .build();
    }

    @Test
    void guestSeesOnlyReleasedPublicBlocks() {
        VisibilityService service = new VisibilityService(null, null, null, null);

        CombineDTO beforeRelease = service.filterCombine(full(), access(Viewer.PUBLIC, false, Map.of()));
        assertNull(beforeRelease);

        CombineDTO guest = service.filterCombine(full(), access(Viewer.PUBLIC, true, Map.of()));
        assertNotNull(guest.getHex());
        assertEquals(70.0, guest.getTotal());
        assertNull(guest.getTests(), "raw results are private by default");
        assertNull(guest.getOwnerOnly());
    }

    @Test
    void ownerSeesPrivateBlocksLabelled() {
        VisibilityService service = new VisibilityService(null, null, null, null);
        CombineDTO owner = service.filterCombine(full(), access(Viewer.OWNER, true, Map.of()));
        assertNotNull(owner.getTests());
        assertEquals(List.of("TEST_RESULTS"), owner.getOwnerOnly());

        // the total score cannot be hidden by the player, so the choice is ignored
        CombineDTO ignored = service.filterCombine(full(), access(Viewer.OWNER, true, Map.of(DataGroup.SCORE_TOTAL, VisibilityLevel.PRIVATE)));
        assertEquals(List.of("TEST_RESULTS"), ignored.getOwnerOnly());
    }

    @Test
    void top30OrdersGoalkeepersFirst() {
        assertTrue(Top30Service.positionRank("goalkeeper") < Top30Service.positionRank("defender"));
        assertTrue(Top30Service.positionRank("midfielder") < Top30Service.positionRank("striker"));
        assertTrue(Top30Service.positionRank("striker") < Top30Service.positionRank(null));
    }
}
