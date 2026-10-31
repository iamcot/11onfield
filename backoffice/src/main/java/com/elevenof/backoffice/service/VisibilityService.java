package com.elevenof.backoffice.service;

import com.elevenof.backoffice.dto.response.CombineDTO;
import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import com.elevenof.backoffice.repository.CompetitionStageRepository;
import com.elevenof.backoffice.repository.PlayerVisibilityRepository;
import com.elevenof.backoffice.repository.VisibilityPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Decides which data groups of a player's profile a viewer gets (see {@link VisibilityRules}). */
@Service
@RequiredArgsConstructor
public class VisibilityService {

    private static final Set<User.Role> STAFF = EnumSet.of(User.Role.ADMIN);

    private final VisibilityPolicyRepository policyRepository;
    private final PanelService panelService;
    private final PlayerVisibilityRepository playerVisibilityRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final CompetitionStageRepository stageRepository;

    /** What one viewer may see of one profile. */
    public static final class Access {
        private final VisibilityRules.Viewer viewer;
        private final Map<DataGroup, VisibilityRules.Effective> groups;

        Access(VisibilityRules.Viewer viewer, Map<DataGroup, VisibilityRules.Effective> groups) {
            this.viewer = viewer;
            this.groups = groups;
        }

        public boolean canSee(DataGroup group) {
            return VisibilityRules.canSee(groups.get(group), viewer);
        }

        /** Visible only because the viewer is the owner. */
        public boolean ownerOnly(DataGroup group) {
            return viewer == VisibilityRules.Viewer.OWNER && canSee(group)
                && !VisibilityRules.canSee(groups.get(group), VisibilityRules.Viewer.PUBLIC);
        }

        public Collection<VisibilityRules.Effective> settings() {
            return groups.values();
        }
    }

    public boolean isStaff(User viewer) {
        return viewer != null && (STAFF.contains(viewer.getRole()) || panelService.highestRole(viewer.getId()).isPresent());
    }

    @Transactional(readOnly = true)
    public Access resolve(User viewer, User owner) {
        VisibilityRules.Viewer kind = isStaff(viewer) ? VisibilityRules.Viewer.STAFF
            : viewer != null && viewer.getId().equals(owner.getId()) ? VisibilityRules.Viewer.OWNER
            : VisibilityRules.Viewer.PUBLIC;

        Competition competition = referenceCompetition(owner.getId());
        List<CompetitionStage> stages = competition == null ? List.of()
            : stageRepository.findByCompetitionIdOrderByStageNumberAsc(competition.getId());
        LocalDateTime now = LocalDateTime.now();
        // the round whose results went public last decides both the release and which policy row applies
        CompetitionStage released = stages.stream()
            .filter(s -> s.getResultsReleaseAt() != null && !s.getResultsReleaseAt().isAfter(now))
            .max(Comparator.comparing(CompetitionStage::getResultsReleaseAt))
            .orElse(null);

        Map<DataGroup, VisibilityPolicy> policies = competition == null ? Map.of() : policiesFor(competition.getId(), released);
        Map<DataGroup, VisibilityLevel> mine = playerVisibilityRepository.findByUserId(owner.getId()).stream()
            .collect(Collectors.toMap(PlayerVisibility::getDataGroup, PlayerVisibility::getLevel, (a, b) -> a));

        Map<DataGroup, VisibilityRules.Effective> groups = new EnumMap<>(DataGroup.class);
        for (DataGroup g : DataGroup.values()) {
            groups.put(g, VisibilityRules.resolve(g, policies.get(g), released != null, mine.get(g)));
        }
        return new Access(kind, groups);
    }

    /** Competition-wide rows, overridden by the rows of the released round. */
    private Map<DataGroup, VisibilityPolicy> policiesFor(Long competitionId, CompetitionStage released) {
        Map<DataGroup, VisibilityPolicy> out = new EnumMap<>(DataGroup.class);
        List<VisibilityPolicy> rows = policyRepository.findByCompetitionId(competitionId);
        rows.stream().filter(p -> p.getStageId() == null).forEach(p -> out.put(p.getDataGroup(), p));
        if (released != null) {
            rows.stream().filter(p -> released.getId().equals(p.getStageId())).forEach(p -> out.put(p.getDataGroup(), p));
        }
        return out;
    }

    /** The latest competition the player took part in. */
    private Competition referenceCompetition(Long userId) {
        return participantRepository.findByUserIdInWithCompetition(List.of(userId)).stream()
            .map(CompetitionParticipant::getCompetition)
            .max(Comparator.comparing(Competition::getId))
            .orElse(null);
    }

    /** Copy of the Combine result with the blocks the viewer may not see removed. */
    public CombineDTO filterCombine(CombineDTO full, Access access) {
        if (full == null) return null;
        List<String> ownerOnly = new ArrayList<>();
        CombineDTO.CombineDTOBuilder out = CombineDTO.builder().stageTitle(full.getStageTitle()).source(full.getSource());
        if (access.canSee(DataGroup.COMBINE_HEX)) {
            out.hex(full.getHex());
            if (access.ownerOnly(DataGroup.COMBINE_HEX)) ownerOnly.add(DataGroup.COMBINE_HEX.name());
        }
        if (access.canSee(DataGroup.SCORE_TOTAL)) {
            out.total(full.getTotal()).totalMax(full.getTotalMax()).grade(full.getGrade()).groups(full.getGroups());
            if (access.ownerOnly(DataGroup.SCORE_TOTAL)) ownerOnly.add(DataGroup.SCORE_TOTAL.name());
        }
        if (access.canSee(DataGroup.TEST_RESULTS)) {
            out.tests(full.getTests());
            if (access.ownerOnly(DataGroup.TEST_RESULTS)) ownerOnly.add(DataGroup.TEST_RESULTS.name());
        }
        if (!ownerOnly.isEmpty()) out.ownerOnly(ownerOnly);
        CombineDTO result = out.build();
        boolean empty = result.getHex() == null && result.getGroups() == null && result.getTests() == null;
        return empty ? null : result;
    }

    // ---------- the player's own choice ----------

    @Transactional
    public void setPlayerLevel(User user, DataGroup group, VisibilityLevel level) {
        VisibilityRules.Effective e = resolve(user, user).groups.get(group);
        if (!e.ownerCanHide()) throw new IllegalArgumentException("Nhóm dữ liệu này không thể tự ẩn");
        if (level.compareTo(e.adminMax()) > 0) throw new IllegalArgumentException("Không thể mở rộng hơn mức ban tổ chức cho phép");
        PlayerVisibility row = playerVisibilityRepository.findByUserIdAndDataGroup(user.getId(), group)
            .orElseGet(() -> PlayerVisibility.builder().userId(user.getId()).dataGroup(group).build());
        row.setLevel(level);
        playerVisibilityRepository.save(row);
    }

    // ---------- admin ----------

    /** One row per group for a competition (or a round), with the built-in default where nothing is saved. */
    @Transactional(readOnly = true)
    public List<VisibilityPolicy> policies(Long competitionId, Long stageId) {
        Map<DataGroup, VisibilityPolicy> saved = policyRepository.findByCompetitionId(competitionId).stream()
            .filter(p -> Objects.equals(p.getStageId(), stageId))
            .collect(Collectors.toMap(VisibilityPolicy::getDataGroup, p -> p, (a, b) -> a));
        List<VisibilityPolicy> out = new ArrayList<>();
        for (DataGroup g : DataGroup.values()) {
            out.add(saved.getOrDefault(g, VisibilityPolicy.builder().competitionId(competitionId).stageId(stageId)
                .dataGroup(g).maxLevel(g.defaultLevel).ownerCanHide(g.ownerCanHide).build()));
        }
        return out;
    }

    @Transactional
    public VisibilityPolicy savePolicy(Long competitionId, Long stageId, DataGroup group, VisibilityLevel max, boolean ownerCanHide) {
        if (group.locked && max.compareTo(group.defaultLevel) > 0) {
            throw new IllegalArgumentException("Nhóm này bị khoá ở mức " + group.defaultLevel);
        }
        if (!group.ownerCanHide && ownerCanHide) {
            throw new IllegalArgumentException("Nhóm này không cho cầu thủ tự ẩn");
        }
        VisibilityPolicy row = (stageId == null
            ? policyRepository.findByCompetitionIdAndStageIdIsNullAndDataGroup(competitionId, group)
            : policyRepository.findByCompetitionIdAndStageIdAndDataGroup(competitionId, stageId, group))
            .orElseGet(() -> VisibilityPolicy.builder().competitionId(competitionId).stageId(stageId).dataGroup(group).build());
        row.setMaxLevel(max);
        row.setOwnerCanHide(ownerCanHide);
        return policyRepository.save(row);
    }

    /** Releases the results of a round now, or at a given moment; null takes them back. */
    @Transactional
    public CompetitionStage release(Long competitionId, Integer stageNumber, LocalDateTime at) {
        CompetitionStage stage = stageRepository.findByCompetitionIdAndStageNumber(competitionId, stageNumber)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vòng"));
        stage.setResultsReleaseAt(at);
        return stageRepository.save(stage);
    }
}
