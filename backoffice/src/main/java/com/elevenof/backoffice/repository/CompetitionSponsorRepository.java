package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionSponsor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionSponsorRepository extends JpaRepository<CompetitionSponsor, Long>, JpaSpecificationExecutor<CompetitionSponsor> {

    /**
     * Find active sponsors for a competition, ordered by display order ascending
     */
    List<CompetitionSponsor> findByCompetitionIdAndIsActiveTrueOrderByDisplayOrderAsc(Long competitionId);

    /**
     * Find all sponsors for a competition, ordered by display order
     */
    List<CompetitionSponsor> findByCompetitionIdOrderByDisplayOrderAsc(Long competitionId);

    long countByCompetitionId(Long competitionId);
}
