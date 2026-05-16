package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.PlayerAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    /**
     * Get all hexagon attribute types with player values (if exists)
     * Left join to always return 6 hexagon attributes, even if player has no data
     */
    @Query("""
        SELECT new com.elevenof.backoffice.dto.response.PlayerAttributeDTO(
            at.attributeKey,
            at.attributeName,
            pa.attributeValue,
            at.attributeGroup,
            at.isHexagon,
            at.isGoalKeeper,
            pa.isSynthetic,
            pa.generationTimestamp
        )
        FROM PlayerAttributeType at
        LEFT JOIN PlayerAttribute pa ON pa.attributeType.id = at.id AND pa.player.id = :playerId
        WHERE at.isHexagon = true
        ORDER BY at.id
        """)
    List<com.elevenof.backoffice.dto.response.PlayerAttributeDTO> getHexagonAttributesWithValues(@Param("playerId") Long playerId);

    // Synthetic attributes support queries

    boolean existsByPlayerIdAndIsSynthetic(Long playerId, Boolean isSynthetic);

    @Query("SELECT pa.generationTimestamp FROM PlayerAttribute pa " +
           "WHERE pa.player.id = :playerId AND pa.isSynthetic = true " +
           "ORDER BY pa.generationTimestamp DESC LIMIT 1")
    Optional<LocalDateTime> findLatestGenerationTimestamp(@Param("playerId") Long playerId);

    @Modifying
    @Query("DELETE FROM PlayerAttribute pa WHERE pa.player.id = :playerId AND pa.isSynthetic = :isSynthetic")
    void deleteByPlayerIdAndIsSynthetic(@Param("playerId") Long playerId, @Param("isSynthetic") Boolean isSynthetic);

    List<PlayerAttribute> findByPlayerIdAndIsSynthetic(Long playerId, Boolean isSynthetic);
}
