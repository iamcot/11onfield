package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.ScoreFormula;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScoreFormulaRepository extends JpaRepository<ScoreFormula, Long> {

    Optional<ScoreFormula> findFirstByStageIdOrderByVersionDesc(Long stageId);
}
