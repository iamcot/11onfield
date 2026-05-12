package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.model.PlayerAttributeType;
import com.elevenof.backoffice.service.PlayerAttributeTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API Controller for Player Attribute Types
 * Provides REST endpoints for managing player attribute type definitions
 */
@RestController
@RequestMapping("/api/player-attribute-types")
@RequiredArgsConstructor
public class PlayerAttributeTypeController {

    private final PlayerAttributeTypeService attributeTypeService;

    @GetMapping
    public ResponseEntity<Page<PlayerAttributeType>> getAllAttributeTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, sortBy));
        Page<PlayerAttributeType> attributeTypes = attributeTypeService.getAllAttributeTypes(pageable);
        return ResponseEntity.ok(attributeTypes);
    }

    @GetMapping("/all")
    public ResponseEntity<List<PlayerAttributeType>> getAllAttributeTypesWithoutPaging() {
        List<PlayerAttributeType> attributeTypes = attributeTypeService.getAllAttributeTypes();
        return ResponseEntity.ok(attributeTypes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerAttributeType> getAttributeTypeById(@PathVariable Long id) {
        PlayerAttributeType attributeType = attributeTypeService.getAttributeTypeById(id);
        return ResponseEntity.ok(attributeType);
    }

    @GetMapping("/key/{attributeKey}")
    public ResponseEntity<PlayerAttributeType> getAttributeTypeByKey(@PathVariable String attributeKey) {
        PlayerAttributeType attributeType = attributeTypeService.getAttributeTypeByKey(attributeKey);
        return ResponseEntity.ok(attributeType);
    }

    @GetMapping("/hexagon")
    public ResponseEntity<List<PlayerAttributeType>> getHexagonAttributeTypes() {
        List<PlayerAttributeType> attributeTypes = attributeTypeService.getHexagonAttributeTypes();
        return ResponseEntity.ok(attributeTypes);
    }

    @GetMapping("/goalkeeper")
    public ResponseEntity<List<PlayerAttributeType>> getGoalKeeperAttributeTypes() {
        List<PlayerAttributeType> attributeTypes = attributeTypeService.getGoalKeeperAttributeTypes();
        return ResponseEntity.ok(attributeTypes);
    }

    @GetMapping("/group/{group}")
    public ResponseEntity<List<PlayerAttributeType>> getAttributeTypesByGroup(@PathVariable String group) {
        List<PlayerAttributeType> attributeTypes = attributeTypeService.getAttributeTypesByGroup(group);
        return ResponseEntity.ok(attributeTypes);
    }

    @PostMapping
    public ResponseEntity<PlayerAttributeType> createAttributeType(
            @RequestBody PlayerAttributeType attributeType,
            Authentication authentication) {

        String createdBy = authentication != null ? authentication.getName() : "system";
        PlayerAttributeType created = attributeTypeService.createAttributeType(attributeType, createdBy);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlayerAttributeType> updateAttributeType(
            @PathVariable Long id,
            @RequestBody PlayerAttributeType attributeType,
            Authentication authentication) {

        String updatedBy = authentication != null ? authentication.getName() : "system";
        PlayerAttributeType updated = attributeTypeService.updateAttributeType(id, attributeType, updatedBy);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttributeType(@PathVariable Long id) {
        attributeTypeService.deleteAttributeType(id);
        return ResponseEntity.noContent().build();
    }
}
