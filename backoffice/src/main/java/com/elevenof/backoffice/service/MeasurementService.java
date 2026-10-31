package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.*;
import com.elevenof.backoffice.repository.*;
import com.elevenof.backoffice.scoring.Reconciler;
import com.elevenof.backoffice.scoring.ScoringEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * The only way a measurement gets in: tablet, file, device and video all call {@link #record}. Each number is kept as a
 * raw record; the attempt's official value is then picked again by {@link Reconciler}. The official value is mirrored to
 * competition_assessment_results so the screens that read that table keep working.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MeasurementService {

    private final MeasurementRawRepository rawRepository;
    private final MeasurementOfficialRepository officialRepository;
    private final AssessmentLockRepository lockRepository;
    private final CompetitionAssessmentRepository assessmentRepository;
    private final CompetitionAssessmentStepRepository stepRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final CompetitionAssessmentResultRepository legacyResultRepository;
    private final ScoringService scoringService;
    private final ParticipantFlagService flagService;

    public record RecordCommand(String clientUuid, Long assessmentId, Long participantId, Integer attemptNumber,
                                BigDecimal value, MeasurementStatus status, String faultNote, MeasurementSource source,
                                Long deviceId, Long recordedBy, LocalDateTime measuredAt, String evidenceUrl,
                                Long supersedesId, String reason) {
    }

    public enum Outcome { ACCEPTED, DUPLICATE }

    public record RecordResult(Outcome outcome, MeasurementRaw raw, MeasurementOfficial official) {
    }

    /** @throws IllegalArgumentException with a Vietnamese message when the record cannot be taken */
    public RecordResult record(RecordCommand c) {
        if (c.clientUuid() != null) {
            Optional<MeasurementRaw> seen = rawRepository.findByClientUuid(c.clientUuid());
            if (seen.isPresent()) {
                MeasurementRaw r = seen.get();
                return new RecordResult(Outcome.DUPLICATE, r, officialRepository
                        .findByAssessmentIdAndParticipantIdAndAttemptNumber(r.getAssessmentId(), r.getParticipantId(), r.getAttemptNumber())
                        .orElse(null));
            }
        }
        CompetitionAssessment a = assessmentRepository.findById(c.assessmentId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nội dung thi " + c.assessmentId()));
        if (!participantRepository.existsById(c.participantId())) {
            throw new IllegalArgumentException("Không tìm thấy thí sinh " + c.participantId());
        }
        if (c.attemptNumber() == null || c.attemptNumber() < 1 || c.attemptNumber() > a.getAttemptsCount()) {
            throw new IllegalArgumentException("Lượt " + c.attemptNumber() + " không hợp lệ (tối đa " + a.getAttemptsCount() + ")");
        }
        MeasurementStatus status = c.status() != null ? c.status() : MeasurementStatus.OK;
        if (status == MeasurementStatus.OK && c.value() == null) throw new IllegalArgumentException("Thiếu giá trị đo");
        if (c.supersedesId() != null) {
            MeasurementRaw old = rawRepository.findById(c.supersedesId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bản ghi cần sửa"));
            if (!old.getAssessmentId().equals(c.assessmentId()) || !old.getParticipantId().equals(c.participantId())
                    || !old.getAttemptNumber().equals(c.attemptNumber())) {
                throw new IllegalArgumentException("Bản ghi cần sửa thuộc lượt khác");
            }
            if (c.reason() == null || c.reason().isBlank()) throw new IllegalArgumentException("Sửa số đo phải ghi lý do");
        }

        LocalDateTime now = LocalDateTime.now();
        MeasurementRaw raw = rawRepository.save(MeasurementRaw.builder()
                .clientUuid(c.clientUuid())
                .assessmentId(c.assessmentId())
                .participantId(c.participantId())
                .attemptNumber(c.attemptNumber())
                .value(status == MeasurementStatus.OK ? c.value() : null)
                .status(status)
                .faultNote(c.faultNote())
                .source(c.source() != null ? c.source() : MeasurementSource.MANUAL)
                .deviceId(c.deviceId())
                .recordedBy(c.recordedBy())
                .measuredAt(c.measuredAt() != null ? c.measuredAt() : now)
                .receivedAt(now)
                .evidenceUrl(c.evidenceUrl())
                .supersedesId(c.supersedesId())
                .reason(c.reason())
                .build());
        MeasurementOfficial official = reconcile(a, c.participantId(), c.attemptNumber(), raw);
        return new RecordResult(Outcome.ACCEPTED, raw, official);
    }

    /**
     * A tablet sends every attempt of the step on each save. An unchanged attempt is skipped; a changed one replaces the
     * live manual record (devices' records stay, so a gap to them still goes to review).
     *
     * @return null when nothing changed
     */
    public RecordResult recordFromTablet(Long assessmentId, Long participantId, Integer attempt, BigDecimal value,
                                         MeasurementStatus status, String faultNote, Long userId, String clientUuid) {
        MeasurementStatus st = status != null ? status : MeasurementStatus.OK;
        List<MeasurementRaw> live = liveRecords(assessmentId, participantId, attempt);
        MeasurementRaw manual = live.stream().filter(r -> r.getSource() == MeasurementSource.MANUAL)
                .reduce((first, second) -> second).orElse(null);
        if (manual != null && manual.getStatus() == st
                && (st != MeasurementStatus.OK || (manual.getValue() != null && manual.getValue().compareTo(value) == 0))) {
            return null;
        }
        return record(new RecordCommand(clientUuid, assessmentId, participantId, attempt, value, st, faultNote,
                MeasurementSource.MANUAL, null, userId, null, null,
                manual != null ? manual.getId() : null, manual != null ? "Sửa trên tablet chấm điểm" : null));
    }

    /** Raw records of an attempt that no later record supersedes. */
    public List<MeasurementRaw> liveRecords(Long assessmentId, Long participantId, Integer attempt) {
        List<MeasurementRaw> all = rawRepository.findByAssessmentIdAndParticipantIdAndAttemptNumberOrderByIdAsc(assessmentId, participantId, attempt);
        Set<Long> superseded = all.stream().map(MeasurementRaw::getSupersedesId).filter(Objects::nonNull).collect(Collectors.toSet());
        return all.stream().filter(r -> !superseded.contains(r.getId())).toList();
    }

    private MeasurementOfficial reconcile(CompetitionAssessment a, Long participantId, Integer attempt, MeasurementRaw newest) {
        List<MeasurementRaw> live = liveRecords(a.getId(), participantId, attempt);
        Optional<MeasurementOfficial> existing = officialRepository.findByAssessmentIdAndParticipantIdAndAttemptNumber(a.getId(), participantId, attempt);
        Reconciler.Current current = existing.map(o -> new Reconciler.Current(o.getRawId(), o.getState())).orElse(null);
        // A correction replaces the record a person picked, so it is picked again rather than sent to review.
        if (current != null && current.state() == OfficialState.RESOLVED && newest != null
                && current.rawId() != null && current.rawId().equals(newest.getSupersedesId())) {
            current = null;
        }
        Reconciler.Decision d = Reconciler.reconcile(live.stream().map(MeasurementService::view).toList(), current,
                newest != null ? view(newest) : null, a.getTolerance(), a.getPlausibleMin(), a.getPlausibleMax());
        if (d == null) return existing.orElse(null);

        OfficialState state = d.state();
        String reason = d.reason();
        if (existing.isEmpty() && isLocked(a.getAssessmentStep().getId())) {
            state = OfficialState.REVIEW;
            reason = Reconciler.AFTER_LOCK;
        }
        if (state == OfficialState.AUTO) {
            MeasurementRaw picked = live.stream().filter(r -> r.getId().equals(d.rawId())).findFirst().orElse(null);
            List<ScoringEngine.Level> scale = scoringService.scaleOf(a.getAssessmentStep());
            if (picked != null && scale != null
                    && ScoringEngine.nearBoundary(picked.getValue(), a.getTolerance(), a.getId(), scale)) {
                reason = Reconciler.NEAR_BOUNDARY;
            }
        }

        MeasurementOfficial o = existing.orElseGet(() -> MeasurementOfficial.builder()
                .assessmentId(a.getId()).participantId(participantId).attemptNumber(attempt).build());
        o.setRawId(d.rawId());
        o.setState(state);
        o.setReviewReason(reason);
        o = officialRepository.save(o);
        mirror(a, participantId, attempt, o);
        return o;
    }

    private static Reconciler.Raw view(MeasurementRaw r) {
        return new Reconciler.Raw(r.getId(), r.getValue(), r.getStatus(), r.getSource(), r.getReceivedAt());
    }

    /** Keeps the old results table equal to the official values (rows only for attempts with a value). */
    private void mirror(CompetitionAssessment a, Long participantId, Integer attempt, MeasurementOfficial o) {
        MeasurementRaw raw = o.getRawId() != null ? rawRepository.findById(o.getRawId()).orElse(null) : null;
        Optional<CompetitionAssessmentResult> legacy = legacyResultRepository
                .findByAssessmentIdAndParticipantIdAndAttemptNumber(a.getId(), participantId, attempt);
        if (raw == null || raw.getStatus() != MeasurementStatus.OK || raw.getValue() == null) {
            legacy.ifPresent(legacyResultRepository::delete);
            return;
        }
        CompetitionAssessmentResult r = legacy.orElseGet(() -> CompetitionAssessmentResult.builder()
                .assessment(a)
                .participant(participantRepository.getReferenceById(participantId))
                .attemptNumber(attempt)
                .build());
        r.setResultValue(raw.getValue().setScale(2, RoundingMode.HALF_UP));
        r.setRecordedAt(raw.getMeasuredAt());
        r.setNotes(raw.getStatus() == MeasurementStatus.OK ? null : raw.getFaultNote());
        legacyResultRepository.save(r);
    }

    /**
     * Runs the action of the level a participant now has on a combine step: FLAG marks Low Performance (once per step).
     * Call after a save or a resolve.
     */
    public void applyLevelAction(Long stepId, Long participantId) {
        CompetitionAssessmentStep step = stepRepository.findById(stepId).orElse(null);
        if (step == null || scoringService.scaleOf(step) == null) return;
        CompetitionAssessmentDay day = step.getAssessmentDay();
        for (ScoringService.ParticipantDay d : scoringService.scoreDay(day.getId(), List.of(participantId))) {
            for (ScoringService.StepResult s : d.steps()) {
                if (s.stepId().equals(stepId) && RatingAction.FLAG.name().equals(s.action())) {
                    flagService.flagLowPerformance(participantId, day.getStage().getId(), stepId,
                            "Mức " + s.level() + " ở bài " + step.getTitle());
                }
            }
        }
    }

    // ============= Review =============

    /**
     * A person picks the value of an attempt: one of its live records, or a new value typed in (kept as a raw record).
     */
    public MeasurementOfficial resolve(Long officialId, Long rawId, BigDecimal newValue, MeasurementStatus newStatus,
                                       String note, Long userId) {
        if (note == null || note.isBlank()) throw new IllegalArgumentException("Phải ghi lý do khi chốt kết quả");
        MeasurementOfficial o = officialRepository.findById(officialId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lượt cần chốt"));
        if (o.getState() == OfficialState.LOCKED) throw new IllegalArgumentException("Bài thi đã khoá sổ, cần mở khoá trước");
        CompetitionAssessment a = assessmentRepository.findById(o.getAssessmentId()).orElseThrow();
        Long picked;
        if (rawId != null) {
            boolean live = liveRecords(o.getAssessmentId(), o.getParticipantId(), o.getAttemptNumber()).stream()
                    .anyMatch(r -> r.getId().equals(rawId));
            if (!live) throw new IllegalArgumentException("Bản ghi không thuộc lượt này hoặc đã bị thay");
            picked = rawId;
        } else {
            MeasurementStatus status = newStatus != null ? newStatus : MeasurementStatus.OK;
            if (status == MeasurementStatus.OK && newValue == null) throw new IllegalArgumentException("Chọn một bản ghi hoặc nhập giá trị");
            LocalDateTime now = LocalDateTime.now();
            picked = rawRepository.save(MeasurementRaw.builder()
                    .assessmentId(o.getAssessmentId()).participantId(o.getParticipantId()).attemptNumber(o.getAttemptNumber())
                    .value(status == MeasurementStatus.OK ? newValue : null).status(status)
                    .source(MeasurementSource.MANUAL).recordedBy(userId)
                    .measuredAt(now).receivedAt(now).reason(note).build()).getId();
        }
        o.setRawId(picked);
        o.setState(OfficialState.RESOLVED);
        o.setReviewReason(null);
        o.setResolvedBy(userId);
        o.setResolvedAt(LocalDateTime.now());
        o.setNote(note);
        o = officialRepository.save(o);
        mirror(a, o.getParticipantId(), o.getAttemptNumber(), o);
        applyLevelAction(a.getAssessmentStep().getId(), o.getParticipantId());
        return o;
    }

    // ============= Locks =============

    public boolean isLocked(Long stepId) {
        return lockRepository.findFirstByStepIdAndUnlockedAtIsNull(stepId).isPresent();
    }

    /**
     * Closes a step: refused while an attempt waits for review, or a participant who started the step misses an attempt
     * (record it as DNS or FAULT first).
     */
    public AssessmentLock lockStep(Long stepId, Long userId) {
        CompetitionAssessmentStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài thi"));
        if (isLocked(stepId)) throw new IllegalArgumentException("Bài thi đã khoá sổ");
        List<CompetitionAssessment> assessments = assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(stepId);
        List<Long> ids = assessments.stream().map(CompetitionAssessment::getId).toList();
        if (ids.isEmpty()) throw new IllegalArgumentException("Bài thi chưa có nội dung");
        long review = officialRepository.countByAssessmentIdInAndState(ids, OfficialState.REVIEW);
        if (review > 0) throw new IllegalArgumentException("Còn " + review + " lượt cần xem, xử lý xong mới khoá được");
        List<MeasurementOfficial> officials = officialRepository.findByAssessmentIdIn(ids);
        Set<String> have = officials.stream().map(o -> o.getAssessmentId() + "_" + o.getParticipantId() + "_" + o.getAttemptNumber())
                .collect(Collectors.toSet());
        Set<Long> participants = officials.stream().map(MeasurementOfficial::getParticipantId).collect(Collectors.toSet());
        int missing = 0;
        for (Long p : participants) {
            for (CompetitionAssessment a : assessments) {
                for (int i = 1; i <= a.getAttemptsCount(); i++) if (!have.contains(a.getId() + "_" + p + "_" + i)) missing++;
            }
        }
        if (missing > 0) throw new IllegalArgumentException("Còn " + missing + " lượt chưa có kết quả, ghi Không thi hoặc Lỗi trước khi khoá");
        for (MeasurementOfficial o : officials) o.setState(OfficialState.LOCKED);
        officialRepository.saveAll(officials);
        log.info("Step {} ({}) locked by {}", stepId, step.getTitle(), userId);
        return lockRepository.save(AssessmentLock.builder().stepId(stepId).lockedBy(userId).lockedAt(LocalDateTime.now()).build());
    }

    public void unlockStep(Long stepId, Long userId, String reason) {
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Mở khoá phải ghi lý do");
        AssessmentLock lock = lockRepository.findFirstByStepIdAndUnlockedAtIsNull(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Bài thi chưa khoá"));
        List<Long> ids = assessmentRepository.findByAssessmentStepIdOrderByDisplayOrderAsc(stepId).stream()
                .map(CompetitionAssessment::getId).toList();
        List<MeasurementOfficial> officials = officialRepository.findByAssessmentIdIn(ids);
        for (MeasurementOfficial o : officials) {
            if (o.getState() == OfficialState.LOCKED) o.setState(o.getResolvedBy() != null ? OfficialState.RESOLVED : OfficialState.AUTO);
        }
        officialRepository.saveAll(officials);
        lock.setUnlockedBy(userId);
        lock.setUnlockedAt(LocalDateTime.now());
        lock.setReason(reason);
        lockRepository.save(lock);
    }
}
