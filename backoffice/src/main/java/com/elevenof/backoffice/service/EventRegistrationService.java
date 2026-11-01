package com.elevenof.backoffice.service;

import com.elevenof.backoffice.event.NotificationEvent;
import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.EventJoined;
import com.elevenof.backoffice.model.EventRegistration;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.EventJoinedRepository;
import com.elevenof.backoffice.repository.EventRegistrationRepository;
import com.elevenof.backoffice.repository.EventRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Applications to recruitment ("Tuyển sinh") events.
 *
 * Flow: the player sends the form → 11of admins get an email → an admin downloads the application as PDF and
 * sends it to the recruiting unit → the admin marks it forwarded → the player gets an email and an in-app notice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventRegistrationService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventJoinedRepository eventJoinedRepository;
    private final UserRepository userRepository;
    private final EventFormFields formFields;
    private final EmailService emailService;
    private final ApplicationEventPublisher publisher;

    /** Who hears about new applications; comma separated. Empty: every ADMIN account that has an email. */
    @Value("${app.event-registration.admin-email:}")
    private String adminEmails;

    @Value("${app.frontend.url:http://localhost:7070}")
    private String frontendUrl;

    private static final DateTimeFormatter DMY_HM = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    /** Sent after the application is saved, so a mail failure never loses an application. */
    public record SubmittedEvent(Long registrationId, boolean updated) {}

    private Event recruitmentEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .filter(e -> e.getStatus() != Event.EventStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        if (event.getEventType() != Event.EventType.RECRUITMENT) {
            throw new IllegalArgumentException("Sự kiện này không nhận hồ sơ đăng ký");
        }
        return event;
    }

    private User user(String userid) {
        return userRepository.findByUserid(userid).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private List<EventFormFields.FormField> formOf(Event event) {
        List<EventFormFields.FormField> fields = formFields.parse(event.getFormSchema());
        return fields.isEmpty() ? formFields.defaultForm() : fields;
    }

    /** The form for the signed-in player, filled with their profile, plus what they already sent if any. */
    @Transactional(readOnly = true)
    public Map<String, Object> formFor(Long eventId, String userid) {
        Event event = recruitmentEvent(eventId);
        User user = user(userid);
        List<EventFormFields.FormField> fields = formOf(event);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("fields", fields);
        out.put("prefill", formFields.prefill(fields, user));
        out.put("open", event.getStatus() == Event.EventStatus.OPEN_REGISTER);
        out.put("partnerName", event.getPartnerName());
        out.put("registration", registrationRepository.findByEventIdAndUserId(eventId, user.getId())
                .map(this::mine).orElse(null));
        return out;
    }

    /** The player's own view of their application. */
    private Map<String, Object> mine(EventRegistration r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("status", r.getStatus().name());
        m.put("answers", formFields.readAnswers(r.getAnswers()));
        m.put("createdAt", r.getCreatedAt());
        m.put("updatedAt", r.getUpdatedAt());
        m.put("forwardedAt", r.getForwardedAt());
        return m;
    }

    @Transactional(readOnly = true)
    public Optional<String> statusOf(Long eventId, String userid) {
        return userRepository.findByUserid(userid)
                .flatMap(u -> registrationRepository.findByEventIdAndUserId(eventId, u.getId()))
                .map(r -> r.getStatus().name());
    }

    /**
     * Saves the player's application. They may send it again to correct it until 11of has passed it on.
     */
    @Transactional
    public Map<String, Object> submit(Long eventId, String userid, Map<String, Object> sent) {
        Event event = recruitmentEvent(eventId);
        if (event.getStatus() != Event.EventStatus.OPEN_REGISTER) {
            throw new IllegalArgumentException("Sự kiện đang không nhận đăng ký");
        }
        User user = user(userid);
        EventRegistration r = registrationRepository.findByEventIdAndUserId(eventId, user.getId()).orElse(null);
        boolean updated = r != null;
        if (r != null && r.getStatus() == EventRegistration.Status.FORWARDED) {
            throw new IllegalArgumentException("Hồ sơ đã được chuyển cho đơn vị tuyển sinh, không thể sửa nữa");
        }
        List<EventFormFields.Answer> answers = formFields.answers(formOf(event), sent, user);
        if (r == null) r = EventRegistration.builder().event(event).user(user).build();
        r.setAnswers(formFields.writeAnswers(answers));
        r = registrationRepository.save(r);

        // An applicant counts as a participant, like the plain "Tham gia" of other events.
        if (!eventJoinedRepository.existsByUserIdAndEventId(user.getId(), eventId)) {
            eventJoinedRepository.save(EventJoined.builder().user(user).event(event).build());
        }

        publisher.publishEvent(new SubmittedEvent(r.getId(), updated));
        if (!updated) {
            publisher.publishEvent(new NotificationEvent(this, user.getId(), "EVENT_REGISTRATION_SUBMITTED",
                    vars(user, event), String.format("{\"eventId\": %d}", event.getId())));
        }
        return mine(r);
    }

    private Map<String, String> vars(User user, Event event) {
        Map<String, String> v = new HashMap<>();
        v.put("fullName", user.getFullName() != null ? user.getFullName() : "");
        v.put("eventTitle", event.getTitle());
        v.put("partnerName", event.getPartnerName() != null && !event.getPartnerName().isBlank()
                ? event.getPartnerName() : "đơn vị tuyển sinh");
        v.put("eventUrl", frontendUrl + "/events/" + event.getId());
        return v;
    }

    // ==================== ADMIN ====================

    @Transactional(readOnly = true)
    public Map<String, Object> listForAdmin(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        List<Map<String, Object>> items = new ArrayList<>();
        for (EventRegistration r : registrationRepository.findByEventIdWithUser(eventId)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("userid", r.getUser().getUserid());
            m.put("fullName", r.getUser().getFullName());
            m.put("phone", r.getUser().getPhone());
            m.put("email", r.getUser().getEmail());
            m.put("avatar", r.getUser().getAvatar());
            m.put("status", r.getStatus().name());
            m.put("createdAt", r.getCreatedAt());
            m.put("updatedAt", r.getUpdatedAt());
            m.put("forwardedAt", r.getForwardedAt());
            items.add(m);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("event", Map.of("id", event.getId(), "title", event.getTitle(),
                "partnerName", Objects.requireNonNullElse(event.getPartnerName(), ""),
                "eventType", event.getEventType().name()));
        out.put("items", items);
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detailForAdmin(Long registrationId) {
        EventRegistration r = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ"));
        Event e = r.getEvent();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("status", r.getStatus().name());
        m.put("answers", formFields.readAnswers(r.getAnswers()));
        m.put("createdAt", r.getCreatedAt());
        m.put("updatedAt", r.getUpdatedAt());
        m.put("forwardedAt", r.getForwardedAt());
        m.put("forwardedBy", r.getForwardedBy() != null ? r.getForwardedBy().getFullName() : null);
        Map<String, Object> ev = new LinkedHashMap<>();
        ev.put("id", e.getId());
        ev.put("title", e.getTitle());
        ev.put("partnerName", e.getPartnerName());
        ev.put("startDate", e.getStartDate());
        ev.put("endDate", e.getEndDate());
        ev.put("location", e.getLocation());
        m.put("event", ev);
        Map<String, Object> u = new LinkedHashMap<>();
        u.put("userid", r.getUser().getUserid());
        u.put("fullName", r.getUser().getFullName());
        u.put("avatar", r.getUser().getAvatar());
        u.put("phone", r.getUser().getPhone());
        u.put("email", r.getUser().getEmail());
        m.put("user", u);
        return m;
    }

    /** Marks the application as passed on to the recruiting unit and tells the player. */
    @Transactional
    public Map<String, Object> forward(Long registrationId, String adminUserid) {
        EventRegistration r = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ"));
        if (r.getStatus() == EventRegistration.Status.FORWARDED) {
            throw new IllegalArgumentException("Hồ sơ này đã được đánh dấu chuyển");
        }
        r.setStatus(EventRegistration.Status.FORWARDED);
        r.setForwardedAt(LocalDateTime.now());
        r.setForwardedBy(userRepository.findByUserid(adminUserid).orElse(null));
        registrationRepository.save(r);
        publisher.publishEvent(new NotificationEvent(this, r.getUser().getId(), "EVENT_REGISTRATION_FORWARDED",
                vars(r.getUser(), r.getEvent()), String.format("{\"eventId\": %d}", r.getEvent().getId())));
        return detailForAdmin(registrationId);
    }

    /** Puts a wrongly marked application back to "waiting". The player is not told. */
    @Transactional
    public Map<String, Object> unforward(Long registrationId) {
        EventRegistration r = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ"));
        r.setStatus(EventRegistration.Status.SUBMITTED);
        r.setForwardedAt(null);
        r.setForwardedBy(null);
        registrationRepository.save(r);
        return detailForAdmin(registrationId);
    }

    public long countWaiting() {
        return registrationRepository.countByStatus(EventRegistration.Status.SUBMITTED);
    }

    // ==================== MAIL TO 11OF ====================

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(readOnly = true, propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void mailAdmins(SubmittedEvent submitted) {
        try {
            EventRegistration r = registrationRepository.findById(submitted.registrationId()).orElse(null);
            if (r == null) return;
            List<String> to = recipients();
            if (to.isEmpty()) {
                log.warn("No admin email for new event registration {}: set app.event-registration.admin-email", r.getId());
                return;
            }
            Event e = r.getEvent();
            User u = r.getUser();
            String link = frontendUrl + "/quan-tri/su-kien/" + e.getId() + "/dang-ky/" + r.getId();
            StringBuilder rows = new StringBuilder();
            for (EventFormFields.Answer a : formFields.readAnswers(r.getAnswers())) {
                if ("heading".equals(a.type())) {
                    rows.append("<tr><td colspan=\"2\" style=\"padding:10px 8px 4px;font-weight:bold;color:#1a5c2a\">")
                        .append(esc(a.label())).append("</td></tr>");
                } else if ("image".equals(a.type())) {
                    rows.append(row(a.label(), a.value() != null ? "<a href=\"" + esc(a.value()) + "\">Xem ảnh</a>" : "—", true));
                } else {
                    rows.append(row(a.label(), EventFormFields.display(a), false));
                }
            }
            String subject = (submitted.updated() ? "[Cập nhật hồ sơ] " : "[Hồ sơ mới] ") + e.getTitle() + " – " + u.getFullName();
            String body = "<html><body style=\"font-family:Arial,sans-serif;color:#1d2a22\">"
                    + "<h2 style=\"margin:0 0 8px\">" + (submitted.updated() ? "Cầu thủ vừa sửa hồ sơ" : "Có hồ sơ tuyển sinh mới") + "</h2>"
                    + "<p>Sự kiện: <strong>" + esc(e.getTitle()) + "</strong>"
                    + (e.getPartnerName() != null ? "<br>Đơn vị tuyển sinh: " + esc(e.getPartnerName()) : "")
                    + "<br>Gửi lúc: " + r.getUpdatedAt().format(DMY_HM) + "</p>"
                    + "<table style=\"border-collapse:collapse;font-size:14px\">" + rows + "</table>"
                    + "<p style=\"margin-top:16px\"><a href=\"" + link + "\" style=\"background:#1a5c2a;color:#fff;padding:10px 16px;text-decoration:none\">Mở hồ sơ để tải PDF</a></p>"
                    + "</body></html>";
            for (String addr : to) {
                try {
                    emailService.sendEmail(addr, subject, body);
                } catch (Exception ex) {
                    log.error("Could not mail new event registration {} to {}", r.getId(), addr, ex);
                }
            }
        } catch (Exception ex) {
            log.error("Could not mail admins about event registration {}", submitted.registrationId(), ex);
        }
    }

    private static String esc(String s) {
        return HtmlUtils.htmlEscape(s == null ? "" : s, "UTF-8");
    }

    private static String row(String label, String value, boolean html) {
        return "<tr><td style=\"padding:4px 8px;color:#66766D;vertical-align:top\">" + esc(label)
                + "</td><td style=\"padding:4px 8px\">" + (html ? value : esc(value.isEmpty() ? "—" : value)) + "</td></tr>";
    }

    private List<String> recipients() {
        if (adminEmails != null && !adminEmails.isBlank()) {
            return Arrays.stream(adminEmails.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        }
        return userRepository.findByRoleIn(List.of(User.Role.ADMIN), PageRequest.of(0, 50)).stream()
                .filter(u -> Boolean.TRUE.equals(u.getEnabled()))
                .map(User::getEmail).filter(m -> m != null && !m.isBlank()).distinct().toList();
    }
}
