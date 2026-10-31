package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.ParticipantFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ParticipantFlagRepository extends JpaRepository<ParticipantFlag, Long> {

    List<ParticipantFlag> findByParticipantIdOrderByCreatedAtDesc(Long participantId);

    List<ParticipantFlag> findByParticipantIdInAndRevokedAtIsNull(Collection<Long> participantIds);

    boolean existsByParticipantIdAndKindAndStepIdAndRevokedAtIsNull(Long participantId, ParticipantFlag.Kind kind, Long stepId);

    long countByParticipantIdAndKindAndRevokedAtIsNull(Long participantId, ParticipantFlag.Kind kind);
}
