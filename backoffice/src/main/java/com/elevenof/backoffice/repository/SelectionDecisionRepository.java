package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.SelectionDecision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SelectionDecisionRepository extends JpaRepository<SelectionDecision, Long> {

    Optional<SelectionDecision> findFirstByCompetitionIdAndRoundKeyOrderByIdDesc(Long competitionId, String roundKey);
}
