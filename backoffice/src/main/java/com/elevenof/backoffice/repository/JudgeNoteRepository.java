package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.JudgeNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JudgeNoteRepository extends JpaRepository<JudgeNote, Long> {

    Optional<JudgeNote> findByJudgeUserIdAndParticipantIdAndStepId(Long judgeUserId, Long participantId, Long stepId);

    List<JudgeNote> findByJudgeUserIdAndStepId(Long judgeUserId, Long stepId);

    List<JudgeNote> findByParticipantIdOrderByUpdatedAtDesc(Long participantId);
}
