package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionAssessmentStepRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionAssessmentStepRatingRepository extends JpaRepository<CompetitionAssessmentStepRating, Long> {

    List<CompetitionAssessmentStepRating> findByAssessmentStepIdOrderByLevelDesc(Long assessmentStepId);

    Optional<CompetitionAssessmentStepRating> findByAssessmentStepIdAndLevel(Long assessmentStepId, Integer level);

    void deleteByAssessmentStepId(Long assessmentStepId);

    long countByAssessmentStepId(Long assessmentStepId);
}
