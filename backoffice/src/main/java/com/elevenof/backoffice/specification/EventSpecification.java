package com.elevenof.backoffice.specification;

import com.elevenof.backoffice.model.Event;
import com.elevenof.backoffice.model.Province;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class EventSpecification {

    /** What the public site shows: not drafts (PLAN), cancelled or deleted events. */
    public static final java.util.Set<Event.EventStatus> PUBLIC_STATUSES = java.util.EnumSet.of(
            Event.EventStatus.OPEN_REGISTER, Event.EventStatus.CLOSE_REGISTER, Event.EventStatus.COMPLETE);

    /** The admin filters, limited to events the public may see. */
    public static Specification<Event> publicWithFilters(String search, Event.EventStatus status, Long provinceId) {
        Specification<Event> visible = (root, query, cb) -> root.get("status").in(PUBLIC_STATUSES);
        return visible.and(withFilters(search, status, provinceId));
    }

    public static Specification<Event> withFilters(
            String search,
            Event.EventStatus status,
            Long provinceId
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Search by title (case-insensitive)
            if (search != null && !search.trim().isEmpty()) {
                predicates.add(cb.like(
                    cb.lower(root.get("title")),
                    "%" + search.toLowerCase() + "%"
                ));
            }

            // Filter by status (including DELETED if specified)
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Filter by province
            if (provinceId != null) {
                Join<Event, Province> provinceJoin = root.join("province", JoinType.LEFT);
                predicates.add(cb.equal(provinceJoin.get("id"), provinceId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
