package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.StageResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StageResultRepository extends JpaRepository<StageResult, Long>, JpaSpecificationExecutor<StageResult> {

    /**
     * Find all results for a stage, ordered by rank position ascending
     */
    List<StageResult> findByStageIdOrderByRankPositionAsc(Long stageId);

    /**
     * Find all results for a stage, ordered by score descending
     */
    List<StageResult> findByStageIdOrderByScoreDesc(Long stageId);

    /**
     * Find all results for a participant, ordered by stage number ascending
     */
    @Query("SELECT sr FROM StageResult sr " +
           "JOIN sr.stage s " +
           "WHERE sr.participant.id = :participantId " +
           "ORDER BY s.stageNumber ASC")
    List<StageResult> findByParticipantIdOrderByStageStageNumberAsc(@Param("participantId") Long participantId);

    /**
     * Find public results only for a stage, ordered by rank position
     */
    List<StageResult> findByStageIdAndIsPublicTrueOrderByRankPositionAsc(Long stageId);

    /**
     * Find result by stage ID and participant ID
     */
    Optional<StageResult> findByStageIdAndParticipantId(Long stageId, Long participantId);

    /**
     * Aggregate scores for leaderboard
     * Returns map with participantId and totalScore for public results only
     */
    @Query("SELECT sr.participant.id as participantId, SUM(sr.score) as totalScore " +
           "FROM StageResult sr " +
           "WHERE sr.stage.competition.id = :competitionId " +
           "AND sr.isPublic = true " +
           "AND sr.participant.id IN :participantIds " +
           "GROUP BY sr.participant.id")
    List<Object[]> aggregateScores(
        @Param("competitionId") Long competitionId,
        @Param("participantIds") List<Long> participantIds
    );

    /**
     * Get total score for a participant in a competition (public results only)
     */
    @Query("SELECT COALESCE(SUM(sr.score), 0) " +
           "FROM StageResult sr " +
           "WHERE sr.participant.id = :participantId " +
           "AND sr.stage.competition.id = :competitionId " +
           "AND sr.isPublic = true")
    BigDecimal getTotalScoreForParticipant(
        @Param("participantId") Long participantId,
        @Param("competitionId") Long competitionId
    );
}
