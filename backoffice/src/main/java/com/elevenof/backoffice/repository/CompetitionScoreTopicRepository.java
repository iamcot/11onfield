package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionScoreTopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompetitionScoreTopicRepository extends JpaRepository<CompetitionScoreTopic, Long> {

    List<CompetitionScoreTopic> findByAssessmentDayIdOrderByDisplayOrderAsc(Long assessmentDayId);
}
