package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionParticipant;
import com.elevenof.backoffice.model.ParticipantStatus;
import com.elevenof.backoffice.model.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionParticipantRepository extends JpaRepository<CompetitionParticipant, Long>, JpaSpecificationExecutor<CompetitionParticipant> {

    /**
     * Check if user is already registered for a competition
     */
    boolean existsByCompetitionIdAndUserId(Long competitionId, Long userId);

    /**
     * Find participant record by competition ID and user ID
     */
    Optional<CompetitionParticipant> findByCompetitionIdAndUserId(Long competitionId, Long userId);

    /**
     * Count participants by competition ID and status
     */
    long countByCompetitionIdAndStatus(Long competitionId, ParticipantStatus status);

    long countByCompetitionId(Long competitionId);

    /**
     * Find participants by competition ID and status
     */
    List<CompetitionParticipant> findByCompetitionIdAndStatus(Long competitionId, ParticipantStatus status);

    /**
     * Find participants by competition ID and selected region
     */
    List<CompetitionParticipant> findByCompetitionIdAndSelectedRegion(Long competitionId, Region region);

    /**
     * Find participants by competition ID and status IN list
     */
    List<CompetitionParticipant> findByCompetitionIdAndStatusIn(Long competitionId, List<ParticipantStatus> statuses);

    /**
     * Critical query for leaderboard with region filter
     * Returns participants filtered by statuses and optional region
     */
    @Query("SELECT p FROM CompetitionParticipant p " +
           "WHERE p.competition.id = :competitionId " +
           "AND p.status IN :statuses " +
           "AND (:region IS NULL OR p.selectedRegion = :region)")
    List<CompetitionParticipant> findByCompetitionAndStatusesAndRegion(
        @Param("competitionId") Long competitionId,
        @Param("statuses") List<ParticipantStatus> statuses,
        @Param("region") Region region
    );

    /**
     * Find all participants for a competition
     */
    List<CompetitionParticipant> findByCompetitionId(Long competitionId);
}
