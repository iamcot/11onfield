package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.CompetitionPanelMember;
import com.elevenof.backoffice.model.CompetitionPanelMember.PanelRole;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.CompetitionPanelMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * The scouting panel of each competition. A member gets the authority ROLE_HLV or ROLE_TTV (the highest across
 * competitions) for the endpoints of the scouting screens; checks tied to one competition use {@link #roleIn}.
 */
@Service
@RequiredArgsConstructor
public class PanelService {

    private final CompetitionPanelMemberRepository repository;

    /** HLV when the user heads any panel, else TTV when on any panel, else empty. */
    @Transactional(readOnly = true)
    public Optional<PanelRole> highestRole(Long userId) {
        return repository.findByUserId(userId).stream().map(CompetitionPanelMember::getPanelRole)
                .min(Enum::compareTo);
    }

    @Transactional(readOnly = true)
    public Optional<PanelRole> roleIn(Long competitionId, Long userId) {
        return repository.findByCompetitionIdAndUserId(competitionId, userId).map(CompetitionPanelMember::getPanelRole);
    }

    /** How many people sit on the competition's panel (everyone on it may vote). */
    @Transactional(readOnly = true)
    public int size(Long competitionId) {
        return repository.findByCompetitionIdOrderByPanelRoleAscIdAsc(competitionId).size();
    }

    /** Only coach and scout accounts can sit on a panel; the website role says what they are, the panel what they do. */
    public static boolean canJoin(User user) {
        return user.getRole() == User.Role.COACH || user.getRole() == User.Role.SCOUTER;
    }
}
