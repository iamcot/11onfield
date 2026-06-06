package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.CompetitionNews;
import com.elevenof.backoffice.model.NewsStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CompetitionNewsRepository extends JpaRepository<CompetitionNews, Long>, JpaSpecificationExecutor<CompetitionNews> {

    List<CompetitionNews> findByCompetitionIdAndStatusOrderByPublishedAtDesc(Long competitionId, NewsStatus status);

    @Query("SELECT n FROM CompetitionNews n LEFT JOIN FETCH n.author WHERE n.competition.id = :competitionId AND n.status = :status ORDER BY n.publishedAt DESC")
    List<CompetitionNews> findPublishedWithAuthor(@Param("competitionId") Long competitionId, @Param("status") NewsStatus status);

    List<CompetitionNews> findByCompetitionIdAndIsFeaturedTrueAndStatus(Long competitionId, NewsStatus status);

    @Query("SELECT n FROM CompetitionNews n LEFT JOIN FETCH n.author WHERE n.competition.id = :competitionId ORDER BY n.createdAt DESC")
    List<CompetitionNews> findByCompetitionIdOrderByCreatedAtDesc(@Param("competitionId") Long competitionId);

    List<CompetitionNews> findByCompetitionIdAndIsFeaturedTrueOrderByPublishedAtDesc(Long competitionId);

    long countByCompetitionId(Long competitionId);
}
