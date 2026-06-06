package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionAssessmentStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionAssessmentStepRepository extends JpaRepository<CompetitionAssessmentStep, Long> {

    List<CompetitionAssessmentStep> findByAssessmentDayIdOrderByDisplayOrderAsc(Long assessmentDayId);

    Optional<CompetitionAssessmentStep> findByAssessmentDayIdAndStepNumber(Long assessmentDayId, Integer stepNumber);

    boolean existsByAssessmentDayIdAndStepNumber(Long assessmentDayId, Integer stepNumber);

    long countByAssessmentDayId(Long assessmentDayId);
}
