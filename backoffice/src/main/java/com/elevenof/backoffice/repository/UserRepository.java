package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByUserid(String userid);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByUserid(String userid);

    Page<User> findByRoleIn(List<User.Role> roles, Pageable pageable);

    /** Users of the given role not yet in the competition whose name or phone contains q (admin "add player"). */
    @Query("SELECT u FROM User u WHERE u.role = :role " +
           "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR u.phone LIKE CONCAT('%', :q, '%')) " +
           "AND NOT EXISTS (SELECT 1 FROM CompetitionParticipant p WHERE p.competition.id = :competitionId AND p.user = u) " +
           "ORDER BY u.fullName")
    List<User> findCandidatesForCompetition(@Param("competitionId") Long competitionId, @Param("role") User.Role role, @Param("q") String q, Pageable pageable);
}
