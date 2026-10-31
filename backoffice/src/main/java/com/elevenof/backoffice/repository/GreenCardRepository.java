package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.GreenCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GreenCardRepository extends JpaRepository<GreenCard, Long> {

    List<GreenCard> findByCompetitionIdOrderByIdAsc(Long competitionId);

    Optional<GreenCard> findByCompetitionIdAndHolderUserId(Long competitionId, Long holderUserId);

    Optional<GreenCard> findByCompetitionIdAndParticipantId(Long competitionId, Long participantId);
}
