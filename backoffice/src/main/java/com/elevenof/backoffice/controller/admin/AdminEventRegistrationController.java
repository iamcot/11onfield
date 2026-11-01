package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.service.EventFormFields;
import com.elevenof.backoffice.service.EventRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin JSON API for recruitment events: the form builder's field catalog and the applications. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR', 'ADMIN')")
public class AdminEventRegistrationController {

    private final EventRegistrationService registrationService;
    private final EventFormFields formFields;

    /** Profile fields the admin can drag into a form, the custom types, and the form a new event starts with. */
    @GetMapping("/event-form/fields")
    public Map<String, Object> formFields() {
        return Map.of(
                "profile", formFields.catalogJson(),
                "customTypes", EventFormFields.CUSTOM_TYPES,
                "defaultForm", formFields.defaultForm());
    }

    @GetMapping("/events/{id}/registrations")
    public Map<String, Object> registrations(@PathVariable Long id) {
        return registrationService.listForAdmin(id);
    }

    @GetMapping("/event-registrations/{rid}")
    public Map<String, Object> registration(@PathVariable Long rid) {
        return registrationService.detailForAdmin(rid);
    }

    /** "Đã chuyển hồ sơ": the player gets an email and an in-app notice. */
    @PostMapping("/event-registrations/{rid}/forward")
    public Map<String, Object> forward(@PathVariable Long rid, Authentication auth) {
        return registrationService.forward(rid, auth.getName());
    }

    @PostMapping("/event-registrations/{rid}/unforward")
    public Map<String, Object> unforward(@PathVariable Long rid) {
        return registrationService.unforward(rid);
    }

    /** Marks several applications forwarded at once (e.g. after sending one batch of PDFs). */
    @PostMapping("/event-registrations/forward")
    public Map<String, Object> forwardMany(@RequestBody Map<String, List<Long>> body, Authentication auth) {
        int done = 0;
        for (Long rid : body.getOrDefault("ids", List.of())) {
            try {
                registrationService.forward(rid, auth.getName());
                done++;
            } catch (IllegalArgumentException ignored) {
                // already forwarded
            }
        }
        return Map.of("forwarded", done);
    }
}
