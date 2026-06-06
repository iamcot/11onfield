package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionAssessmentStepScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionAssessmentStepScoreRepository extends JpaRepository<CompetitionAssessmentStepScore, Long> {

    Optional<CompetitionAssessmentStepScore> findByAssessmentStepIdAndParticipantId(Long assessmentStepId, Long participantId);

    List<CompetitionAssessmentStepScore> findByParticipantId(Long participantId);

    List<CompetitionAssessmentStepScore> findByAssessmentStepId(Long assessmentStepId);

    void deleteByAssessmentStepIdAndParticipantId(Long assessmentStepId, Long participantId);
}
