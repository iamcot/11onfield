package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.MeasurementOfficial;
import com.elevenof.backoffice.model.OfficialState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MeasurementOfficialRepository extends JpaRepository<MeasurementOfficial, Long> {

    Optional<MeasurementOfficial> findByAssessmentIdAndParticipantIdAndAttemptNumber(Long assessmentId, Long participantId, Integer attemptNumber);

    List<MeasurementOfficial> findByAssessmentIdInAndParticipantId(Collection<Long> assessmentIds, Long participantId);

    List<MeasurementOfficial> findByAssessmentIdIn(Collection<Long> assessmentIds);

    List<MeasurementOfficial> findByAssessmentIdInAndStateOrderByUpdatedAtAsc(Collection<Long> assessmentIds, OfficialState state);

    long countByAssessmentIdInAndState(Collection<Long> assessmentIds, OfficialState state);

    @Query("SELECT DISTINCT o.participantId FROM MeasurementOfficial o WHERE o.assessmentId IN :ids")
    List<Long> findParticipantIdsByAssessmentIdIn(@Param("ids") Collection<Long> assessmentIds);
}
