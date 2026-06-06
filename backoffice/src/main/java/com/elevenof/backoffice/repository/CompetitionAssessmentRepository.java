package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionAssessmentRepository extends JpaRepository<CompetitionAssessment, Long> {

    List<CompetitionAssessment> findByAssessmentStepIdOrderByDisplayOrderAsc(Long assessmentStepId);

    Optional<CompetitionAssessment> findByAssessmentStepIdAndAssessmentNumber(Long assessmentStepId, Integer assessmentNumber);

    boolean existsByAssessmentStepIdAndAssessmentNumber(Long assessmentStepId, Integer assessmentNumber);

    long countByAssessmentStepId(Long assessmentStepId);
}
