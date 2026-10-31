package com.elevenof.backoffice.service;

import com.elevenof.backoffice.dto.response.Top30DTO;
import com.elevenof.backoffice.model.CompetitionParticipant;
import com.elevenof.backoffice.model.ParticipantStatus;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Collator;
import java.util.*;

/**
 * The selected Top 30 for the public competition page. The list counts as finalized once the head of the jury has
 * picked it ({@link CompetitionSelectionService#selectTop30} moves the 30 to SELECTED_TOP30); the later
 * {@code selection_decisions} table (task 1.15) should replace that check.
 */
@Service
@RequiredArgsConstructor
public class Top30Service {

    private static final List<ParticipantStatus> SELECTED = List.of(ParticipantStatus.SELECTED_TOP30, ParticipantStatus.SELECTED_TOP11);
    private static final List<String> POSITION_ORDER = List.of("goalkeeper", "defender", "centerback", "midfielder", "striker");

    private final CompetitionParticipantRepository participantRepository;

    @Transactional(readOnly = true)
    public Top30DTO get(Long competitionId) {
        List<CompetitionParticipant> selected = participantRepository.findByCompetitionIdAndStatusIn(competitionId, SELECTED);
        if (selected.isEmpty()) return Top30DTO.builder().published(false).players(List.of()).build();

        Collator vi = Collator.getInstance(Locale.forLanguageTag("vi"));
        List<Top30DTO.Entry> players = selected.stream()
            .map(CompetitionParticipant::getUser)
            .filter(u -> Boolean.TRUE.equals(u.getEnabled()))
            .map(u -> Top30DTO.Entry.builder()
                .userid(u.getUserid())
                .fullName(u.getFullName())
                .avatar(u.getAvatar())
                .position(firstPosition(u))
                .build())
            .sorted(Comparator.comparingInt((Top30DTO.Entry e) -> positionRank(e.getPosition()))
                .thenComparing(e -> e.getFullName() == null ? "" : e.getFullName(), vi))
            .toList();
        return Top30DTO.builder().published(true).players(players).build();
    }

    private static String firstPosition(User user) {
        Player player = user.getPlayer();
        if (player == null || player.getPositions() == null || player.getPositions().isBlank()) return null;
        return player.getPositions().split(",")[0].trim();
    }

    static int positionRank(String position) {
        int i = position == null ? -1 : POSITION_ORDER.indexOf(position);
        return i < 0 ? POSITION_ORDER.size() : i;
    }
}
