package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionAssessmentDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionAssessmentDayRepository extends JpaRepository<CompetitionAssessmentDay, Long> {

    List<CompetitionAssessmentDay> findByStageIdOrderByDisplayOrderAsc(Long stageId);

    Optional<CompetitionAssessmentDay> findByStageIdAndDayNumber(Long stageId, Integer dayNumber);

    boolean existsByStageIdAndDayNumber(Long stageId, Integer dayNumber);

    long countByStageId(Long stageId);
}
