package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.ScoreSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ScoreSnapshotRepository extends JpaRepository<ScoreSnapshot, Long> {

    Optional<ScoreSnapshot> findByStageIdAndParticipantId(Long stageId, Long participantId);

    List<ScoreSnapshot> findByStageIdIn(Collection<Long> stageIds);
}
