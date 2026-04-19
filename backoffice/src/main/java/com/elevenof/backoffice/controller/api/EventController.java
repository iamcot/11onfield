package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.dto.response.EventDetailDTO;
import com.elevenof.backoffice.dto.response.EventListDTO;
import com.elevenof.backoffice.dto.response.UserListItemDTO;
import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.EventRepository;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.service.EventService;
import com.elevenof.backoffice.specification.EventSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
public class EventController {

    private final EventRepository eventRepository;
    private final EventService eventService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<EventListDTO>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long provinceId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder
    ) {
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            sort = sortOrder.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        } else {
            sort = Sort.by("startDate").descending();
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        Event.EventStatus tempStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                tempStatus = Event.EventStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                // Invalid status
            }
        }
        final Event.EventStatus eventStatus = tempStatus;

        Specification<Event> spec = EventSpecification.withFilters(search, eventStatus, provinceId);
        Page<Event> events = eventRepository.findAll(spec, pageable);

        Page<EventListDTO> eventList = events.map(event -> {
            long participantCount = eventService.getParticipantCount(event.getId());

            return EventListDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .picture(event.getPicture())
                .shortContent(event.getShortContent())
                .startDate(event.getStartDate())
                .startTime(event.getStartTime())
                .endDate(event.getEndDate())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .provinceName(event.getProvince() != null ? event.getProvince().getName() : null)
                .status(event.getStatus().name())
                .participantCount((int) participantCount)
                .build();
        });

        return ResponseEntity.ok(eventList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDetailDTO> getEventById(@PathVariable Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (event.getStatus() == Event.EventStatus.DELETED) {
            throw new ResourceNotFoundException("Event not found");
        }

        long participantCount = eventService.getParticipantCount(event.getId());

        EventDetailDTO response = EventDetailDTO.builder()
            .id(event.getId())
            .title(event.getTitle())
            .picture(event.getPicture())
            .shortContent(event.getShortContent())
            .content(event.getContent())
            .startDate(event.getStartDate())
            .startTime(event.getStartTime())
            .endDate(event.getEndDate())
            .endTime(event.getEndTime())
            .location(event.getLocation())
            .provinceName(event.getProvince() != null ? event.getProvince().getName() : null)
            .status(event.getStatus().name())
            .participantCount((int) participantCount)
            .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> joinEvent(
            @PathVariable Long id,
            Authentication authentication
    ) {
        log.info("[EventController] POST /api/events/{}/join called", id);
        log.info("[EventController] Authentication: {}", authentication != null ? authentication.getName() : "null");

        String userid = authentication.getName();
        log.info("[EventController] Got userid from token: {}", userid);

        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long userId = user.getId();
        log.info("[EventController] Resolved to userId (id): {}", userId);

        eventService.joinEvent(userId, id);
        log.info("[EventController] joinEvent completed successfully");

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/join")
    public ResponseEntity<Void> leaveEvent(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String userid = authentication.getName();
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long userId = user.getId();

        eventService.leaveEvent(userId, id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/is-joined")
    public ResponseEntity<Map<String, Boolean>> isUserJoined(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String userid = authentication.getName();
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long userId = user.getId();

        boolean isJoined = eventService.isUserJoined(userId, id);
        return ResponseEntity.ok(Map.of("isJoined", isJoined));
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<UserListItemDTO>> getParticipants(@PathVariable Long id) {
        List<User> participants = eventService.getParticipants(id);

        List<UserListItemDTO> response = participants.stream()
            .map(user -> UserListItemDTO.builder()
                .userid(user.getUserid())
                .fullName(user.getFullName())
                .avatar(user.getAvatar())
                .role(user.getRole().name())
                .build())
            .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userid}/joined")
    public ResponseEntity<Page<EventListDTO>> getUserJoinedEvents(
            @PathVariable String userid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("[EventController] GET /api/events/user/{}/joined called with page={}, size={}", userid, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // userid is a String like "606ed86c34a611f", need to look up user first
        User user = userRepository.findByUserid(userid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long userId = user.getId();
        log.info("[EventController] Resolved userid '{}' to userId (id): {}", userid, userId);

        Page<Event> events = eventService.getUserJoinedEvents(userId, pageable);
        log.info("[EventController] Retrieved {} total events", events.getTotalElements());

        Page<EventListDTO> eventList = events.map(event -> {
            long participantCount = eventService.getParticipantCount(event.getId());

            return EventListDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .picture(event.getPicture())
                .shortContent(event.getShortContent())
                .startDate(event.getStartDate())
                .startTime(event.getStartTime())
                .endDate(event.getEndDate())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .provinceName(event.getProvince() != null ? event.getProvince().getName() : null)
                .status(event.getStatus().name())
                .participantCount((int) participantCount)
                .build();
        });

        log.info("[EventController] Returning {} events in response", eventList.getContent().size());
        return ResponseEntity.ok(eventList);
    }
}
