package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.MeasurementRaw;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeasurementRawRepository extends JpaRepository<MeasurementRaw, Long> {

    Optional<MeasurementRaw> findByClientUuid(String clientUuid);

    List<MeasurementRaw> findByAssessmentIdAndParticipantIdAndAttemptNumberOrderByIdAsc(Long assessmentId, Long participantId, Integer attemptNumber);
}
