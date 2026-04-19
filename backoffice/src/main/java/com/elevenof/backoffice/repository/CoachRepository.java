package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Coach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Coach entity
 * Provides CRUD operations and custom queries for coach profiles
 */
@Repository
public interface CoachRepository extends JpaRepository<Coach, Long> {

    Optional<Coach> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
