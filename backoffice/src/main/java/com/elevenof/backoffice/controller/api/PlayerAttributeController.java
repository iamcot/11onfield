package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.model.PlayerAttribute;
import com.elevenof.backoffice.service.PlayerAttributeService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API Controller for Player Attributes
 * Provides REST endpoints for managing player attribute values
 */
@RestController
@RequestMapping("/api/player-attributes")
@RequiredArgsConstructor
public class PlayerAttributeController {

    private final PlayerAttributeService attributeService;

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<PlayerAttribute>> getPlayerAttributes(@PathVariable Long playerId) {
        List<PlayerAttribute> attributes = attributeService.getPlayerAttributes(playerId);
        return ResponseEntity.ok(attributes);
    }

    @GetMapping("/player/{playerId}/map")
    public ResponseEntity<Map<String, Integer>> getPlayerAttributesAsMap(@PathVariable Long playerId) {
        Map<String, Integer> attributes = attributeService.getPlayerAttributesAsMap(playerId);
        return ResponseEntity.ok(attributes);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_USER')")
    @PostMapping("/player/{playerId}")
    public ResponseEntity<PlayerAttribute> createOrUpdatePlayerAttribute(
            @PathVariable Long playerId,
            @RequestBody PlayerAttributeRequest request,
            Authentication authentication) {

        String updatedBy = authentication != null ? authentication.getName() : "system";
        PlayerAttribute attribute = attributeService.createOrUpdatePlayerAttribute(
            playerId,
            request.getAttributeTypeId(),
            request.getValue(),
            updatedBy
        );
        return ResponseEntity.ok(attribute);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_USER')")
    @PostMapping("/player/{playerId}/bulk")
    public ResponseEntity<Void> bulkUpdatePlayerAttributes(
            @PathVariable Long playerId,
            @RequestBody Map<Long, Integer> attributeValues,
            Authentication authentication) {

        String updatedBy = authentication != null ? authentication.getName() : "system";
        attributeService.bulkUpdatePlayerAttributes(playerId, attributeValues, updatedBy);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_USER')")
    @DeleteMapping("/{attributeId}")
    public ResponseEntity<Void> deletePlayerAttribute(@PathVariable Long attributeId) {
        attributeService.deletePlayerAttribute(attributeId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_USER')")
    @DeleteMapping("/player/{playerId}")
    public ResponseEntity<Void> deleteAllPlayerAttributes(@PathVariable Long playerId) {
        attributeService.deleteAllPlayerAttributes(playerId);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class PlayerAttributeRequest {
        private Long attributeTypeId;
        private Integer value;
    }
}
