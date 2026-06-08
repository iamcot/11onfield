package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionAssessmentResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionAssessmentResultRepository extends JpaRepository<CompetitionAssessmentResult, Long> {

    List<CompetitionAssessmentResult> findByAssessmentIdAndParticipantIdOrderByAttemptNumberAsc(Long assessmentId, Long participantId);

    Optional<CompetitionAssessmentResult> findByAssessmentIdAndParticipantIdAndAttemptNumber(Long assessmentId, Long participantId, Integer attemptNumber);

    List<CompetitionAssessmentResult> findByParticipantId(Long participantId);

    void deleteByAssessmentIdAndParticipantId(Long assessmentId, Long participantId);

    long countByAssessmentIdAndParticipantId(Long assessmentId, Long participantId);

    @Query("SELECT DISTINCT r.participant.id FROM CompetitionAssessmentResult r " +
           "WHERE r.assessment.assessmentStep.id = :stepId ORDER BY r.participant.id DESC")
    List<Long> findDistinctParticipantIdsByStepId(@Param("stepId") Long stepId, Pageable pageable);

    @Query("SELECT COUNT(r) FROM CompetitionAssessmentResult r " +
           "WHERE r.assessment.assessmentStep.id = :stepId AND r.participant.id = :participantId")
    long countFilledAssessmentsByStepAndParticipant(@Param("stepId") Long stepId, @Param("participantId") Long participantId);

    @Query("SELECT COUNT(DISTINCT r.participant.id) FROM CompetitionAssessmentResult r " +
           "WHERE r.assessment.assessmentStep.id = :stepId")
    long countDistinctParticipantsByStepId(@Param("stepId") Long stepId);
}
