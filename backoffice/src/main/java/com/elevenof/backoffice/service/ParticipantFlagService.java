package com.elevenof.backoffice.service;

import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.ParticipantFlag;
import com.elevenof.backoffice.model.ParticipantFlag.Kind;
import com.elevenof.backoffice.repository.ParticipantFlagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/** Contestant flags: who is blocked from the next stations, and the Low Performance flag raised by the scoring. */
@Service
@RequiredArgsConstructor
public class ParticipantFlagService {

    private final ParticipantFlagRepository flagRepository;

    /** A doctor's "not fit" flag stops the contestant at every following station until it is revoked. */
    @Transactional(readOnly = true)
    public boolean isBlocked(Long participantId) {
        return flagRepository.countByParticipantIdAndKindAndRevokedAtIsNull(participantId, Kind.MEDICAL_OUT) > 0;
    }

    /** Throws when the contestant may not be scored; call before saving a measurement. */
    @Transactional(readOnly = true)
    public void assertNotBlocked(Long participantId) {
        if (isBlocked(participantId)) {
            throw new IllegalStateException("Thí sinh đã bị bác sĩ loại khỏi vòng thi, không thể ghi điểm");
        }
    }

    @Transactional(readOnly = true)
    public Set<Long> blockedAmong(Collection<Long> participantIds) {
        Set<Long> out = new HashSet<>();
        if (participantIds.isEmpty()) return out;
        for (ParticipantFlag f : flagRepository.findByParticipantIdInAndRevokedAtIsNull(participantIds)) {
            if (f.getKind() == Kind.MEDICAL_OUT) out.add(f.getParticipantId());
        }
        return out;
    }

    /** Called by the scoring when a step lands on a rating whose action is FLAG. Once per contestant and step. */
    @Transactional
    public void flagLowPerformance(Long participantId, Long stageId, Long stepId, String reason) {
        if (flagRepository.existsByParticipantIdAndKindAndStepIdAndRevokedAtIsNull(participantId, Kind.LOW_PERFORMANCE, stepId)) return;
        flagRepository.save(ParticipantFlag.builder()
                .participantId(participantId).stageId(stageId).stepId(stepId)
                .kind(Kind.LOW_PERFORMANCE).reason(reason).createdAt(LocalDateTime.now()).build());
    }

    /** Discipline violations, used as a tie-break. */
    @Transactional(readOnly = true)
    public long disciplineCount(Long participantId) {
        return flagRepository.countByParticipantIdAndKindAndRevokedAtIsNull(participantId, Kind.DISCIPLINE);
    }

    @Transactional
    public ParticipantFlag revoke(Long flagId, Long userId, String reason) {
        ParticipantFlag f = flagRepository.findById(flagId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cờ"));
        if (f.getRevokedAt() != null) return f;
        f.setRevokedAt(LocalDateTime.now());
        f.setRevokedBy(userId);
        f.setRevokeReason(reason);
        return flagRepository.save(f);
    }
}
