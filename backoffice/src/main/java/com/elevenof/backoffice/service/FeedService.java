package com.elevenof.backoffice.service;

import com.elevenof.backoffice.dto.response.FeedItemDTO;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAchievement;
import com.elevenof.backoffice.model.PlayerHighlight;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.EventJoinedRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final EventJoinedRepository eventJoinedRepository;

    public List<FeedItemDTO> getUserFeeds(String userid, boolean isOwner) {
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<FeedItemDTO> feeds = new ArrayList<>();

        // Add events user has joined
        feeds.addAll(getEventFeeds(user));

        // Add achievements and highlights if user is a player
        if (User.Role.PLAYER.equals(user.getRole())) {
            Player player = playerRepository.findByUserId(user.getId())
                    .orElse(null);
            if (player != null) {
                feeds.addAll(getAchievementFeeds(player, user, isOwner));
                feeds.addAll(getHighlightFeeds(player, user, isOwner));
            }
        }

        // Sort by date descending (most recent first)
        return feeds.stream()
                .sorted(Comparator.comparing(FeedItemDTO::getDate).reversed())
                .collect(Collectors.toList());
    }

    private List<FeedItemDTO> getEventFeeds(User user) {
        List<FeedItemDTO> feeds = new ArrayList<>();

        // Get events user has joined (limit to recent 20)
        var events = eventJoinedRepository.findEventsByUserId(user.getId(), PageRequest.of(0, 20));

        for (Event event : events.getContent()) {
            LocalDate eventDate = event.getStartDate() != null
                ? event.getStartDate()
                : LocalDate.now();

            FeedItemDTO feed = FeedItemDTO.builder()
                    .type("event")
                    .date(eventDate)
                    .createdAt(event.getCreatedAt())
                    .fullName(user.getFullName())
                    .userid(user.getUserid())
                    .event(FeedItemDTO.EventDTO.builder()
                            .eventId(event.getId())
                            .title(event.getTitle())
                            .description(event.getShortContent())
                            .location(event.getLocation())
                            .startDate(event.getStartDate())
                            .startTime(event.getStartTime())
                            .endDate(event.getEndDate())
                            .endTime(event.getEndTime())
                            .status(mapEventStatus(event.getStatus()))
                            .imageUrl(event.getPicture())
                            .build())
                    .build();
            feeds.add(feed);
        }

        return feeds;
    }

    private String mapEventStatus(Event.EventStatus status) {
        if (status == null) return "UPCOMING";

        switch (status) {
            case PLAN:
            case OPEN_REGISTER:
            case CLOSE_REGISTER:
                return "UPCOMING";
            case COMPLETE:
                return "COMPLETED";
            case CANCELLED:
            case DELETED:
                return "CANCELLED";
            default:
                return "UPCOMING";
        }
    }

    private List<FeedItemDTO> getAchievementFeeds(Player player, User user, boolean isOwner) {
        List<FeedItemDTO> feeds = new ArrayList<>();

        for (PlayerAchievement achievement : player.getAchievements()) {
            // Filter: owners see all, visitors see only APPROVED
            if (!isOwner && achievement.getApprovalStatus() != PlayerAchievement.ApprovalStatus.APPROVED) {
                continue;
            }

            FeedItemDTO feed = FeedItemDTO.builder()
                    .type("achievement")
                    .date(achievement.getAchievementDate())
                    .createdAt(achievement.getCreatedAt())
                    .fullName(user.getFullName())
                    .userid(user.getUserid())
                    .achievement(FeedItemDTO.AchievementDTO.builder()
                            .id(achievement.getId())
                            .title(achievement.getTitle())
                            .description(achievement.getDescription())
                            .achievementType(achievement.getType().name())
                            .achievementDate(achievement.getAchievementDate())
                            .approvalStatus(achievement.getApprovalStatus().name())
                            .build())
                    .build();
            feeds.add(feed);
        }

        return feeds;
    }

    private List<FeedItemDTO> getHighlightFeeds(Player player, User user, boolean isOwner) {
        List<FeedItemDTO> feeds = new ArrayList<>();

        for (PlayerHighlight highlight : player.getHighlights()) {
            // Filter: owners see all, visitors see only APPROVED
            if (!isOwner && highlight.getApprovalStatus() != PlayerHighlight.ApprovalStatus.APPROVED) {
                continue;
            }

            FeedItemDTO feed = FeedItemDTO.builder()
                    .type("highlight")
                    .date(highlight.getHighlightDate())
                    .createdAt(highlight.getCreatedAt())
                    .fullName(user.getFullName())
                    .userid(user.getUserid())
                    .highlight(FeedItemDTO.HighlightDTO.builder()
                            .id(highlight.getId())
                            .url(highlight.getUrl())
                            .platform(highlight.getPlatform())
                            .title(highlight.getTitle())
                            .highlightDate(highlight.getHighlightDate())
                            .approvalStatus(highlight.getApprovalStatus().name())
                            .build())
                    .build();
            feeds.add(feed);
        }

        return feeds;
    }
}
