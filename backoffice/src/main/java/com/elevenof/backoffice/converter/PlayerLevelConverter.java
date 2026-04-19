package com.elevenof.backoffice.converter;

import com.elevenof.backoffice.model.Player;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Custom JPA converter for PlayerLevel enum
 * Handles invalid/legacy values gracefully by converting them to null
 * instead of throwing an exception
 */
@Converter(autoApply = true)
@Slf4j
public class PlayerLevelConverter implements AttributeConverter<Player.PlayerLevel, String> {

    @Override
    public String convertToDatabaseColumn(Player.PlayerLevel attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public Player.PlayerLevel convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        try {
            return Player.PlayerLevel.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            // Log the invalid value and return null instead of throwing exception
            log.warn("Invalid PlayerLevel value in database: '{}'. Converting to null.", dbData);
            return null;
        }
    }
}
