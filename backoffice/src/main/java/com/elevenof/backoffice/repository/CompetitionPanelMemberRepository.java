package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionPanelMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompetitionPanelMemberRepository extends JpaRepository<CompetitionPanelMember, Long> {

    List<CompetitionPanelMember> findByCompetitionIdOrderByPanelRoleAscIdAsc(Long competitionId);

    List<CompetitionPanelMember> findByUserId(Long userId);

    Optional<CompetitionPanelMember> findByCompetitionIdAndUserId(Long competitionId, Long userId);
}
