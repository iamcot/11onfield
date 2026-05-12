package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAttribute;
import com.elevenof.backoffice.model.PlayerAttributeType;
import com.elevenof.backoffice.repository.PlayerAttributeRepository;
import com.elevenof.backoffice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<PlayerAttribute> getPlayerAttributes(Long playerId) {
        return attributeRepository.findByPlayerId(playerId);
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
}
