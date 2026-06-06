package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionStage;
import com.elevenof.backoffice.model.Region;
import com.elevenof.backoffice.model.StageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionStageRepository extends JpaRepository<CompetitionStage, Long>, JpaSpecificationExecutor<CompetitionStage> {

    /**
     * Find all stages for a competition, ordered by stage number ascending
     */
    List<CompetitionStage> findByCompetitionIdOrderByStageNumberAsc(Long competitionId);

    /**
     * Find specific stage by competition ID and stage number
     */
    Optional<CompetitionStage> findByCompetitionIdAndStageNumber(Long competitionId, Integer stageNumber);

    /**
     * Find stages by competition ID and stage type
     */
    List<CompetitionStage> findByCompetitionIdAndStageType(Long competitionId, StageType stageType);

    /**
     * Find regional audition stage by competition ID and region
     */
    Optional<CompetitionStage> findByCompetitionIdAndRegion(Long competitionId, Region region);

    /**
     * Find stages by competition ID and stage type, ordered by stage number
     */
    List<CompetitionStage> findByCompetitionIdAndStageTypeOrderByStageNumberAsc(Long competitionId, StageType stageType);

    long countByCompetitionId(Long competitionId);
}
