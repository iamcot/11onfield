package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Player entity
 * Provides CRUD operations and custom queries for player profiles
 */
@Repository
public interface PlayerRepository extends JpaRepository<Player, Long>, JpaSpecificationExecutor<Player> {

    Optional<Player> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
