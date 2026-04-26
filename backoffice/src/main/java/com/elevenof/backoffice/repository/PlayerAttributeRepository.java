package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.PlayerAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PlayerAttribute entity
 * Provides CRUD operations and custom queries for player attributes
 */
@Repository
public interface PlayerAttributeRepository extends JpaRepository<PlayerAttribute, Long>, JpaSpecificationExecutor<PlayerAttribute> {

    List<PlayerAttribute> findByPlayerId(Long playerId);

    Optional<PlayerAttribute> findByPlayerIdAndAttributeTypeId(Long playerId, Long attributeTypeId);

    boolean existsByPlayerIdAndAttributeTypeId(Long playerId, Long attributeTypeId);

    void deleteByPlayerId(Long playerId);
}
