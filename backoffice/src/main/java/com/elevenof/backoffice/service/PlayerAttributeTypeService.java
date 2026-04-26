package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.PlayerAttributeType;
import com.elevenof.backoffice.repository.PlayerAttributeTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing Player Attribute Types
 * Handles CRUD operations for player attribute type definitions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlayerAttributeTypeService {

    private final PlayerAttributeTypeRepository attributeTypeRepository;

    public Page<PlayerAttributeType> getAllAttributeTypes(Pageable pageable) {
        return attributeTypeRepository.findAll(pageable);
    }

    public List<PlayerAttributeType> getAllAttributeTypes() {
        return attributeTypeRepository.findAll();
    }

    public PlayerAttributeType getAttributeTypeById(Long id) {
        return attributeTypeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Attribute type not found with ID: " + id));
    }

    public PlayerAttributeType getAttributeTypeByKey(String attributeKey) {
        return attributeTypeRepository.findByAttributeKey(attributeKey)
            .orElseThrow(() -> new IllegalArgumentException("Attribute type not found with key: " + attributeKey));
    }

    public List<PlayerAttributeType> getHexagonAttributeTypes() {
        return attributeTypeRepository.findByIsHexagon(true);
    }

    public List<PlayerAttributeType> getGoalKeeperAttributeTypes() {
        return attributeTypeRepository.findByIsGoalKeeper(true);
    }

    public List<PlayerAttributeType> getAttributeTypesByGroup(String group) {
        return attributeTypeRepository.findByAttributeGroup(group);
    }

    @Transactional
    public PlayerAttributeType createAttributeType(PlayerAttributeType attributeType, String createdBy) {
        if (attributeTypeRepository.existsByAttributeKey(attributeType.getAttributeKey())) {
            throw new IllegalStateException("Attribute type with key already exists: " + attributeType.getAttributeKey());
        }

        // Validate hexagon limit if is_hexagon is true
        if (Boolean.TRUE.equals(attributeType.getIsHexagon())) {
            validateHexagonLimit(null, attributeType.getIsGoalKeeper());
        }

        attributeType.setCreatedBy(createdBy);
        attributeType.setUpdatedBy(createdBy);

        PlayerAttributeType saved = attributeTypeRepository.save(attributeType);
        log.info("Created attribute type: {} by {}", saved.getAttributeKey(), createdBy);
        return saved;
    }

    @Transactional
    public PlayerAttributeType updateAttributeType(Long id, PlayerAttributeType updatedData, String updatedBy) {
        PlayerAttributeType existing = getAttributeTypeById(id);

        // Check if trying to change key to an existing one
        if (!existing.getAttributeKey().equals(updatedData.getAttributeKey())
            && attributeTypeRepository.existsByAttributeKey(updatedData.getAttributeKey())) {
            throw new IllegalStateException("Attribute type with key already exists: " + updatedData.getAttributeKey());
        }

        // Validate hexagon limit if changing to is_hexagon = true
        // or if already hexagon but changing goalkeeper flag
        boolean wasHexagon = Boolean.TRUE.equals(existing.getIsHexagon());
        boolean willBeHexagon = Boolean.TRUE.equals(updatedData.getIsHexagon());
        boolean goalKeeperChanged = !existing.getIsGoalKeeper().equals(updatedData.getIsGoalKeeper());

        if (willBeHexagon && (!wasHexagon || goalKeeperChanged)) {
            validateHexagonLimit(id, updatedData.getIsGoalKeeper());
        }

        existing.setAttributeKey(updatedData.getAttributeKey());
        existing.setAttributeName(updatedData.getAttributeName());
        existing.setIsHexagon(updatedData.getIsHexagon());
        existing.setIsGoalKeeper(updatedData.getIsGoalKeeper());
        existing.setAttributeGroup(updatedData.getAttributeGroup());
        existing.setUpdatedBy(updatedBy);

        PlayerAttributeType saved = attributeTypeRepository.save(existing);
        log.info("Updated attribute type ID: {} by {}", id, updatedBy);
        return saved;
    }

    @Transactional
    public void deleteAttributeType(Long id) {
        PlayerAttributeType existing = getAttributeTypeById(id);
        attributeTypeRepository.delete(existing);
        log.info("Deleted attribute type ID: {}", id);
    }

    /**
     * Validates that hexagon limit (6 attributes) is not exceeded
     * @param excludeId ID to exclude from count (when updating)
     * @param isGoalKeeper Whether this is for goalkeeper attributes
     * @throws IllegalStateException if limit is exceeded
     */
    private void validateHexagonLimit(Long excludeId, Boolean isGoalKeeper) {
        boolean gk = Boolean.TRUE.equals(isGoalKeeper);
        long currentCount = attributeTypeRepository.countByIsHexagonAndIsGoalKeeper(true, gk);

        // If updating, don't count the current record
        if (excludeId != null) {
            PlayerAttributeType existing = getAttributeTypeById(excludeId);
            if (Boolean.TRUE.equals(existing.getIsHexagon()) && existing.getIsGoalKeeper().equals(gk)) {
                currentCount--;
            }
        }

        if (currentCount >= 6) {
            String message = gk
                ? "Đã đạt giới hạn 6 chỉ số hexagon cho thủ môn. Vui lòng bỏ chọn 'Hiển thị trên hexagon' cho một chỉ số thủ môn khác trước khi tạo mới."
                : "Đã đạt giới hạn 6 chỉ số hexagon cho cầu thủ. Vui lòng bỏ chọn 'Hiển thị trên hexagon' cho một chỉ số khác trước khi tạo mới.";
            throw new IllegalStateException(message);
        }
    }
}
