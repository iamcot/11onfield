package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.PlayerAttributeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PlayerAttributeType entity
 * Provides CRUD operations and custom queries for player attribute types
 */
@Repository
public interface PlayerAttributeTypeRepository extends JpaRepository<PlayerAttributeType, Long>, JpaSpecificationExecutor<PlayerAttributeType> {

    Optional<PlayerAttributeType> findByAttributeKey(String attributeKey);

    boolean existsByAttributeKey(String attributeKey);

    List<PlayerAttributeType> findByIsHexagon(Boolean isHexagon);

    List<PlayerAttributeType> findByIsGoalKeeper(Boolean isGoalKeeper);

    List<PlayerAttributeType> findByAttributeGroup(String attributeGroup);

    // Count hexagon attributes by goalkeeper flag
    long countByIsHexagonAndIsGoalKeeper(Boolean isHexagon, Boolean isGoalKeeper);
}
