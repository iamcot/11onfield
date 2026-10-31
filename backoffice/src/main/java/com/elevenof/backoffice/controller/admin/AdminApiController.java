package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.model.Competition;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.ParticipantStatus;
import com.elevenof.backoffice.model.Region;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.CompetitionParticipantRepository;
import com.elevenof.backoffice.repository.EventRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.CompetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * JSON API for the Next.js admin: who is logged in and the dashboard numbers.
 * Access to /api/admin/** is limited to staff roles in SecurityConfig.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminApiController {

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final EventRepository eventRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final CompetitionService competitionService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        User user = userRepository.findByUserid(authentication.getName()).orElseThrow();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userid", user.getUserid());
        body.put("fullName", user.getFullName());
        // On the admin site a coach or scout on a scouting panel acts as HLV or TTV.
        String panel = authentication.getAuthorities().stream().map(a -> a.getAuthority())
                .filter(a -> a.equals("ROLE_HLV") || a.equals("ROLE_TTV")).map(a -> a.substring(5)).findFirst().orElse(null);
        body.put("role", panel != null ? panel : user.getRole().name());
        body.put("websiteRole", user.getRole().name());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/dashboard")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("totalPlayers", playerRepository.count());
        body.put("totalUsers", userRepository.count());
        body.put("totalEvents", eventRepository.countActiveEvents());

        List<Map<String, Object>> upcoming = new ArrayList<>();
        for (Event e : eventRepository.findUpcomingEvents().stream().limit(5).toList()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", e.getId());
            row.put("title", e.getTitle());
            row.put("startDate", e.getStartDate());
            row.put("location", e.getLocation());
            upcoming.add(row);
        }
        body.put("upcomingEvents", upcoming);

        Competition current = competitionService.getCurrentCompetition().orElse(null);
        if (current != null) {
            Map<String, Object> comp = new LinkedHashMap<>();
            comp.put("id", current.getId());
            comp.put("season", current.getSeason());
            comp.put("totalParticipants", participantRepository.countByCompetitionId(current.getId()));

            Map<String, Long> byStatus = new LinkedHashMap<>();
            for (ParticipantStatus s : ParticipantStatus.values()) {
                byStatus.put(s.name(), participantRepository.countByCompetitionIdAndStatus(current.getId(), s));
            }
            comp.put("byStatus", byStatus);

            Map<String, Long> byRegion = new LinkedHashMap<>();
            for (Region r : Region.values()) {
                byRegion.put(r.name(),
                        (long) participantRepository.findByCompetitionIdAndSelectedRegion(current.getId(), r).size());
            }
            comp.put("byRegion", byRegion);
            body.put("competition", comp);
        }
        return ResponseEntity.ok(body);
    }
}
