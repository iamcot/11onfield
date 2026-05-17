package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Player entity
 * Provides CRUD operations and custom queries for player profiles
 */
@Repository
public interface PlayerRepository extends JpaRepository<Player, Long>, JpaSpecificationExecutor<Player> {

    Optional<Player> findByUserId(Long userId);

    /**
     * Find player by user ID with all lazy collections eagerly fetched
     * Use this method when you need to access achievements, highlights, or socials
     */
    @Query("SELECT p FROM Player p " +
           "LEFT JOIN FETCH p.achievements " +
           "LEFT JOIN FETCH p.highlights " +
           "LEFT JOIN FETCH p.socials " +
           "WHERE p.user.id = :userId")
    Optional<Player> findByUserIdWithCollections(@Param("userId") Long userId);

    boolean existsByUserId(Long userId);
}
