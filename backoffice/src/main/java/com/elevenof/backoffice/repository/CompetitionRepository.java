package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Competition;
import com.elevenof.backoffice.model.CompetitionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, Long>, JpaSpecificationExecutor<Competition> {

    /**
     * Find competition by season number
     */
    Optional<Competition> findBySeason(Integer season);

    /**
     * Get latest/current season (highest season number)
     */
    Optional<Competition> findTopByOrderBySeasonDesc();

    /**
     * Find competitions by status, ordered by season descending
     */
    List<Competition> findByStatusOrderBySeasonDesc(CompetitionStatus status);

    /**
     * Find competitions by status NOT IN list, ordered by season descending
     */
    List<Competition> findByStatusNotInOrderBySeasonDesc(List<CompetitionStatus> statuses);

    /**
     * Find all competitions with participants eager loaded for admin list
     */
    @Query("SELECT DISTINCT c FROM Competition c LEFT JOIN FETCH c.participants ORDER BY c.season DESC")
    List<Competition> findAllWithParticipants();

    /**
     * Find competition by ID with participants and user details eager loaded
     */
    @Query("SELECT DISTINCT c FROM Competition c " +
           "LEFT JOIN FETCH c.participants p " +
           "LEFT JOIN FETCH p.user " +
           "WHERE c.id = :id")
    Optional<Competition> findByIdWithParticipants(@Param("id") Long id);

    /**
     * Find competition by ID with stages eager loaded
     */
    @Query("SELECT c FROM Competition c LEFT JOIN FETCH c.stages WHERE c.id = :id")
    Optional<Competition> findByIdWithStages(@Param("id") Long id);
}
