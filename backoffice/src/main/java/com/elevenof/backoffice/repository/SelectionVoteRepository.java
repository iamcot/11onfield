package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.SelectionVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SelectionVoteRepository extends JpaRepository<SelectionVote, Long> {

    List<SelectionVote> findByCompetitionIdAndRoundKey(Long competitionId, String roundKey);

    List<SelectionVote> findByCompetitionIdAndRoundKeyAndJudgeUserId(Long competitionId, String roundKey, Long judgeUserId);
}
