package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.CompetitionParticipant;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Số báo danh. A number is given once, the first time a registration is seen valid (enabled PLAYER, verified profile,
 * not withdrawn), as the next number of that competition, and never changes or gets reused. Numbers restart at 1 for
 * each competition, so a new season starts its own list.
 */
@Service
public class SbdService {

    private static final String VALID = """
        FROM competition_participants p
        JOIN users u ON u.id = p.user_id
        JOIN players pl ON pl.id = u.id
        WHERE p.competition_id = ? AND u.role = 'PLAYER' AND u.enabled = 1 AND pl.verified = 1 AND p.status <> 'WITHDRAWN'
          AND p.sbd IS NULL""";

    private final JdbcTemplate jdbc;
    private final CompetitionParticipantRepository participantRepository;
    private final SbdService self;

    public SbdService(JdbcTemplate jdbc, CompetitionParticipantRepository participantRepository,
                      @org.springframework.context.annotation.Lazy SbdService self) {
        this.jdbc = jdbc;
        this.participantRepository = participantRepository;
        this.self = self;
    }

    /** The contestants of a competition in SBD order, after numbering anyone valid who has no number yet. */
    public List<CompetitionParticipant> contestants(Long competitionId) {
        assignMissing(competitionId);
        return participantRepository.findByCompetitionIdWithUserOrderByRegistrationDate(competitionId);
    }

    /** participantId -> SBD for the contestants of a competition. */
    public Map<Long, Integer> map(List<CompetitionParticipant> contestants) {
        Map<Long, Integer> m = new HashMap<>();
        for (CompetitionParticipant p : contestants) m.put(p.getId(), p.getSbd());
        return m;
    }

    /** The contestant with this SBD, or null. */
    public CompetitionParticipant find(List<CompetitionParticipant> contestants, int sbd) {
        for (CompetitionParticipant p : contestants) if (p.getSbd() != null && p.getSbd() == sbd) return p;
        return null;
    }

    public void assignMissing(Long competitionId) {
        Integer missing = jdbc.queryForObject("SELECT COUNT(*) " + VALID, Integer.class, competitionId);
        if (missing != null && missing > 0) self.assignInOwnTransaction(competitionId);
    }

    /** Its own transaction, so it also works when the caller's transaction is read-only. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void assignInOwnTransaction(Long competitionId) {
        // Serialises numbering per competition so two requests never hand out the same number.
        jdbc.queryForList("SELECT id FROM competitions WHERE id = ? FOR UPDATE", competitionId);
        List<Long> ids = jdbc.queryForList("SELECT p.id " + VALID + " ORDER BY p.registration_date, p.id", Long.class, competitionId);
        Integer max = jdbc.queryForObject("SELECT COALESCE(MAX(sbd), 0) FROM competition_participants WHERE competition_id = ?",
                Integer.class, competitionId);
        int next = max == null ? 0 : max;
        for (Long id : ids) jdbc.update("UPDATE competition_participants SET sbd = ? WHERE id = ?", ++next, id);
    }
}
