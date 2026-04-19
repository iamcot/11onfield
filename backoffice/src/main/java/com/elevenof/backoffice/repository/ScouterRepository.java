package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Scouter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Scouter entity
 * Provides CRUD operations and custom queries for scouter profiles
 */
@Repository
public interface ScouterRepository extends JpaRepository<Scouter, Long> {

    Optional<Scouter> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
