package com.elevenof.backoffice.specification;

import com.elevenof.backoffice.model.Address;
import com.elevenof.backoffice.model.CompetitionParticipant;
import com.elevenof.backoffice.model.ParticipantStatus;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.User;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic filtering of players
 * Supports search by name, filter by positions, province, level, and preferred foot
 */
public class PlayerSpecification {

    /**
     * Build dynamic specification based on provided filters
     *
     * @param search Search string for name (case-insensitive)
     * @param positions List of positions to filter (OR condition)
     * @param provinceId Province ID to filter by
     * @param level Player level enum to filter by
     * @param preferredFoot Preferred foot to filter by
     * @param competitionId Only players registered in this competition (and not withdrawn)
     * @return Specification for filtering User entities with PLAYER role
     */
    public static Specification<User> withFilters(
            String search,
            List<String> positions,
            Long provinceId,
            Player.PlayerLevel level,
            String preferredFoot,
            Long competitionId
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Must be PLAYER role
            predicates.add(cb.equal(root.get("role"), User.Role.PLAYER));

            // Must be enabled (not blocked)
            predicates.add(cb.equal(root.get("enabled"), true));

            // Search by name (case-insensitive)
            if (search != null && !search.trim().isEmpty()) {
                predicates.add(cb.like(
                    cb.lower(root.get("fullName")),
                    "%" + search.toLowerCase() + "%"
                ));
            }

            // Join to Player entity - INNER JOIN to ensure player profile exists
            Join<User, Player> playerJoin = root.join("player", JoinType.INNER);

            // Only show verified players
            predicates.add(cb.equal(playerJoin.get("verified"), true));

            if (competitionId != null) {
                predicates.add(registeredIn(competitionId, root, query, cb));
            }

            // Filter by positions (contains any)
            if (positions != null && !positions.isEmpty()) {
                List<Predicate> positionPredicates = new ArrayList<>();
                for (String position : positions) {
                    positionPredicates.add(cb.like(
                        playerJoin.get("positions"),
                        "%" + position + "%"
                    ));
                }
                predicates.add(cb.or(positionPredicates.toArray(new Predicate[0])));
            }

            // Filter by level
            if (level != null) {
                predicates.add(cb.equal(playerJoin.get("level"), level));
            }

            // Filter by preferred foot
            if (preferredFoot != null && !preferredFoot.isEmpty()) {
                predicates.add(cb.equal(playerJoin.get("preferredFoot"), preferredFoot));
            }

            // Filter by province
            if (provinceId != null) {
                Join<User, Address> addressJoin = root.join("address", JoinType.LEFT);
                predicates.add(cb.equal(addressJoin.get("province").get("id"), provinceId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Players registered in the competition: the same rule for its participant count and its player list. */
    public static Specification<User> registeredIn(Long competitionId) {
        return withFilters(null, null, null, null, null, competitionId);
    }

    private static Predicate registeredIn(Long competitionId, Root<User> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        Subquery<Long> sub = query.subquery(Long.class);
        Root<CompetitionParticipant> p = sub.from(CompetitionParticipant.class);
        sub.select(p.get("id")).where(
            cb.equal(p.get("competition").get("id"), competitionId),
            cb.equal(p.get("user"), root),
            cb.notEqual(p.get("status"), ParticipantStatus.WITHDRAWN)
        );
        return cb.exists(sub);
    }
}
