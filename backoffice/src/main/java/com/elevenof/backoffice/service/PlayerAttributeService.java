package com.elevenof.backoffice.service;

import com.elevenof.backoffice.dto.response.PlayerAttributeDTO;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAttribute;
import com.elevenof.backoffice.model.PlayerAttributeType;
import com.elevenof.backoffice.repository.PlayerAttributeRepository;
import com.elevenof.backoffice.repository.PlayerAttributeTypeRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing Player Attributes
 * Handles CRUD operations for player attribute values
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlayerAttributeService {

    private final PlayerAttributeRepository attributeRepository;
    private final PlayerRepository playerRepository;
    private final PlayerAttributeTypeService attributeTypeService;
    private final PlayerAttributeTypeRepository attributeTypeRepository;
    private final SyntheticAttributeService syntheticAttributeService;

    public List<PlayerAttribute> getPlayerAttributes(Long playerId) {
        return attributeRepository.findByPlayerId(playerId);
    }

    /**
     * Get hexagon attributes with values for a player
     * Prioritizes synthetic attributes if available, otherwise returns real hexagon attributes
     * Always returns 6 attributes for display
     */
    public List<PlayerAttributeDTO> getHexagonAttributesWithValues(Long playerId) {
        // Check if player has synthetic attributes
        if (attributeRepository.existsByPlayerIdAndIsSynthetic(playerId, true)) {
            // Return synthetic attributes
            return getSyntheticAttributesWithValues(playerId);
        } else {
            // Return real hexagon attributes (existing behavior)
            return attributeRepository.getHexagonAttributesWithValues(playerId);
        }
    }

    /**
     * Get synthetic attributes for display (6 attributes: FIT, EXP, SKL, PRF, ACH, HLT)
     */
    private List<PlayerAttributeDTO> getSyntheticAttributesWithValues(Long playerId) {
        List<String> syntheticKeys = List.of("FIT", "EXP", "SKL", "PRF", "ACH", "HLT");
        List<PlayerAttributeDTO> result = new ArrayList<>();

        for (String key : syntheticKeys) {
            PlayerAttributeType type = attributeTypeRepository.findByAttributeKey(key).orElse(null);
            if (type == null) continue;

            PlayerAttribute attr = attributeRepository
                    .findByPlayerIdAndAttributeTypeId(playerId, type.getId())
                    .orElse(null);

            result.add(PlayerAttributeDTO.builder()
                    .attributeKey(key)
                    .attributeName(type.getAttributeName())
                    .attributeValue(attr != null ? attr.getAttributeValue() : null)
                    .attributeGroup(type.getAttributeGroup())
                    .isHexagon(true) // Mark as hexagon for display
                    .isGoalKeeper(false)
                    .isSynthetic(attr != null ? attr.getIsSynthetic() : null)
                    .generationTimestamp(attr != null ? attr.getGenerationTimestamp() : null)
                    .build());
        }

        return result;
    }

    public Map<String, Integer> getPlayerAttributesAsMap(Long playerId) {
        List<PlayerAttribute> attributes = attributeRepository.findByPlayerId(playerId);
        return attributes.stream()
            .collect(Collectors.toMap(
                attr -> attr.getAttributeType().getAttributeKey(),
                PlayerAttribute::getAttributeValue
            ));
    }

    @Transactional
    public PlayerAttribute createOrUpdatePlayerAttribute(Long playerId, Long attributeTypeId, Integer value, String updatedBy) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> new IllegalArgumentException("Player not found with ID: " + playerId));

        PlayerAttributeType attributeType = attributeTypeService.getAttributeTypeById(attributeTypeId);

        // Validate value range (0-100)
        if (value < 0 || value > 100) {
            throw new IllegalArgumentException("Attribute value must be between 0 and 100");
        }

        PlayerAttribute attribute = attributeRepository
            .findByPlayerIdAndAttributeTypeId(playerId, attributeTypeId)
            .orElse(PlayerAttribute.builder()
                .player(player)
                .attributeType(attributeType)
                .createdBy(updatedBy)
                .build());

        attribute.setAttributeValue(value);
        attribute.setUpdatedBy(updatedBy);

        PlayerAttribute saved = attributeRepository.save(attribute);
        log.info("Saved attribute {} for player ID: {} with value: {}",
            attributeType.getAttributeKey(), playerId, value);
        return saved;
    }

    @Transactional
    public void bulkUpdatePlayerAttributes(Long playerId, Map<Long, Integer> attributeValues, String updatedBy) {
        for (Map.Entry<Long, Integer> entry : attributeValues.entrySet()) {
            createOrUpdatePlayerAttribute(playerId, entry.getKey(), entry.getValue(), updatedBy);
        }
        log.info("Bulk updated {} attributes for player ID: {}", attributeValues.size(), playerId);
    }

    @Transactional
    public void deletePlayerAttribute(Long attributeId) {
        PlayerAttribute attribute = attributeRepository.findById(attributeId)
            .orElseThrow(() -> new IllegalArgumentException("Attribute not found with ID: " + attributeId));

        attributeRepository.delete(attribute);
        log.info("Deleted attribute ID: {}", attributeId);
    }

    @Transactional
    public void deleteAllPlayerAttributes(Long playerId) {
        attributeRepository.deleteByPlayerId(playerId);
        log.info("Deleted all attributes for player ID: {}", playerId);
    }

    // ==================== Synthetic Attributes Methods ====================

    /**
     * Generate and save synthetic attributes for a player
     * Creates or updates 6 synthetic attributes based on player data
     *
     * @param userId User ID (player's user ID)
     * @param generatedBy Who triggered the generation (e.g., "SYSTEM_REGISTRATION", admin username)
     */
    @Transactional
    public void generateAndSaveSyntheticAttributes(Long userId, String generatedBy) {
        // Generate attribute values
        Map<String, Integer> syntheticValues = syntheticAttributeService.generateSyntheticAttributes(userId);

        // Get player
        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found for user ID: " + userId));

        LocalDateTime now = LocalDateTime.now();

        // Save each synthetic attribute
        for (Map.Entry<String, Integer> entry : syntheticValues.entrySet()) {
            String attributeKey = entry.getKey();
            Integer value = entry.getValue();

            // Find attribute type by key
            PlayerAttributeType attributeType = attributeTypeRepository.findByAttributeKey(attributeKey)
                    .orElseThrow(() -> new RuntimeException("Attribute type not found: " + attributeKey));

            // Create or update attribute
            PlayerAttribute attribute = attributeRepository
                    .findByPlayerIdAndAttributeTypeId(player.getId(), attributeType.getId())
                    .orElse(PlayerAttribute.builder()
                            .player(player)
                            .attributeType(attributeType)
                            .createdBy(generatedBy)
                            .build());

            attribute.setAttributeValue(value);
            attribute.setIsSynthetic(true);
            attribute.setGenerationTimestamp(now);
            attribute.setUpdatedBy(generatedBy);

            attributeRepository.save(attribute);
        }

        log.info("Saved {} synthetic attributes for player user ID: {} by {}",
                syntheticValues.size(), userId, generatedBy);
    }

    /**
     * Bulk generate synthetic attributes for multiple players
     *
     * @param userIds List of user IDs
     * @param generatedBy Who triggered the generation
     */
    @Transactional
    public void bulkGenerateSyntheticAttributes(List<Long> userIds, String generatedBy) {
        int successCount = 0;
        int errorCount = 0;

        for (Long userId : userIds) {
            try {
                generateAndSaveSyntheticAttributes(userId, generatedBy);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to generate synthetic attributes for user ID: {}", userId, e);
                errorCount++;
            }
        }

        log.info("Bulk generation completed: {} success, {} errors", successCount, errorCount);
    }

    /**
     * Switch player to use synthetic attributes
     * Deletes existing real attributes and generates synthetic ones
     *
     * @param userId User ID
     * @param updatedBy Admin username
     */
    @Transactional
    public void switchToSyntheticAttributes(Long userId, String updatedBy) {
        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found for user ID: " + userId));

        // Delete real attributes
        attributeRepository.deleteByPlayerIdAndIsSynthetic(player.getId(), false);
        log.info("Deleted real attributes for player user ID: {}", userId);

        // Generate synthetic attributes
        generateAndSaveSyntheticAttributes(userId, updatedBy);
        log.info("Switched player user ID: {} to synthetic attributes", userId);
    }

    /**
     * Switch player to use real attributes
     * Deletes synthetic attributes (admin will manually enter real ones)
     *
     * @param userId User ID
     */
    @Transactional
    public void switchToRealAttributes(Long userId) {
        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found for user ID: " + userId));

        // Delete synthetic attributes
        attributeRepository.deleteByPlayerIdAndIsSynthetic(player.getId(), true);
        log.info("Deleted synthetic attributes for player user ID: {}, ready for real attributes", userId);
    }

    /**
     * Check if player has synthetic attributes
     *
     * @param userId User ID
     * @return true if player has any synthetic attributes
     */
    public boolean hasSyntheticAttributes(Long userId) {
        Player player = playerRepository.findByUserId(userId).orElse(null);
        if (player == null) return false;
        return attributeRepository.existsByPlayerIdAndIsSynthetic(player.getId(), true);
    }

    /**
     * Check if player has real attributes
     *
     * @param userId User ID
     * @return true if player has any real (manually entered) attributes
     */
    public boolean hasRealAttributes(Long userId) {
        Player player = playerRepository.findByUserId(userId).orElse(null);
        if (player == null) return false;
        return attributeRepository.existsByPlayerIdAndIsSynthetic(player.getId(), false);
    }

    /**
     * Get the latest generation timestamp for player's synthetic attributes
     *
     * @param userId User ID
     * @return Latest generation timestamp, or null if no synthetic attributes
     */
    public LocalDateTime getGenerationTimestamp(Long userId) {
        Player player = playerRepository.findByUserId(userId).orElse(null);
        if (player == null) return null;
        return attributeRepository.findLatestGenerationTimestamp(player.getId()).orElse(null);
    }
}
