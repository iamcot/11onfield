package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionAssessmentResult;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
