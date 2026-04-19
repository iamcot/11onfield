package com.elevenof.backoffice.service;

import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.EventJoined;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.EventJoinedRepository;
import com.elevenof.backoffice.repository.EventRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final EventJoinedRepository eventJoinedRepository;
    private final UserRepository userRepository;

    @Transactional
    public void joinEvent(Long userId, Long eventId) {
        log.info("[EventService] joinEvent called with userId={}, eventId={}", userId, eventId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        log.info("[EventService] Found user: userid={}, fullName={}", user.getUserid(), user.getFullName());

        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        log.info("[EventService] Found event: id={}, title={}, status={}", event.getId(), event.getTitle(), event.getStatus());

        // Validate event status
        if (event.getStatus() != Event.EventStatus.OPEN_REGISTER) {
            log.error("[EventService] Event registration is not open. Status={}", event.getStatus());
            throw new IllegalArgumentException("Event registration is not open");
        }

        // Check if already joined
        boolean alreadyJoined = eventJoinedRepository.existsByUserIdAndEventId(userId, eventId);
        log.info("[EventService] Already joined check: {}", alreadyJoined);
        if (alreadyJoined) {
            log.info("[EventService] User {} already joined event {}", userId, eventId);
            return; // Idempotent
        }

        EventJoined eventJoined = EventJoined.builder()
            .user(user)
            .event(event)
            .build();

        EventJoined saved = eventJoinedRepository.save(eventJoined);
        log.info("[EventService] Successfully saved EventJoined: id={}, userId={}, eventId={}", saved.getId(), userId, eventId);
        log.info("[EventService] User {} joined event {}", userId, eventId);
    }

    @Transactional
    public void leaveEvent(Long userId, Long eventId) {
        eventJoinedRepository.deleteByUserIdAndEventId(userId, eventId);
        log.info("User {} left event {}", userId, eventId);
    }

    public boolean isUserJoined(Long userId, Long eventId) {
        return eventJoinedRepository.existsByUserIdAndEventId(userId, eventId);
    }

    public long getParticipantCount(Long eventId) {
        return eventJoinedRepository.countByEventId(eventId);
    }

    public List<User> getParticipants(Long eventId) {
        return eventJoinedRepository.findParticipantsByEventId(eventId);
    }

    public Page<Event> getUserJoinedEvents(Long userId, Pageable pageable) {
        log.info("[EventService] getUserJoinedEvents called with userId={}, pageable={}", userId, pageable);
        Page<Event> events = eventJoinedRepository.findEventsByUserId(userId, pageable);
        log.info("[EventService] Found {} events for userId={}", events.getTotalElements(), userId);
        return events;
    }
}
