package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.ManualScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManualScoreRepository extends JpaRepository<ManualScore, Long> {

    /** Every row of the stage, oldest first; the current value of a component is the one nothing supersedes. */
    List<ManualScore> findByStageIdOrderByIdAsc(Long stageId);

    List<ManualScore> findByStageIdAndParticipantIdOrderByIdAsc(Long stageId, Long participantId);

    /** Rows no later row supersedes, i.e. the values in force. */
    @Query("select m from ManualScore m where m.stageId = :stageId and not exists "
            + "(select 1 from ManualScore n where n.supersedesId = m.id)")
    List<ManualScore> findCurrentByStageId(@Param("stageId") Long stageId);
}
