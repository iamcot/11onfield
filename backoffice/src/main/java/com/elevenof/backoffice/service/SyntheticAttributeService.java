package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.PlayerAchievement;
import com.elevenof.backoffice.model.PlayerHighlight;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for generating synthetic (auto-calculated) player attributes
 * based on registration data and profile information.
 *
 * Uses simple, transparent formulas to create baseline attributes
 * for players before real attributes are manually assessed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyntheticAttributeService {

    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;

    /**
     * Generate all 6 synthetic attributes for a player
     *
     * @param userId The user ID (player's user ID)
     * @return Map of attribute keys to values (0-100)
     */
    public Map<String, Integer> generateSyntheticAttributes(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found for user ID: " + userId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Map<String, Integer> attributes = new HashMap<>();

        attributes.put("FIT", calculatePhysicalScore(player, user));
        attributes.put("EXP", calculateExperienceScore(player));
        attributes.put("SKL", calculateSkillsScore(player));
        attributes.put("PRF", calculateProfileCompletenessScore(player, user));
        attributes.put("ACH", calculateAchievementsScore(player));
        attributes.put("HLT", calculateHighlightsScore(player));

        log.info("Generated synthetic attributes for player {}: FIT={}, EXP={}, SKL={}, PRF={}, ACH={}, HLT={}",
                userId, attributes.get("FIT"), attributes.get("EXP"), attributes.get("SKL"),
                attributes.get("PRF"), attributes.get("ACH"), attributes.get("HLT"));

        return attributes;
    }

    /**
     * Calculate Physical score (Thể chất)
     * Based on height, weight (BMI), and age
     * Score: 0-100
     */
    public Integer calculatePhysicalScore(Player player, User user) {
        int score = 50; // Base score

        try {
            // BMI factor
            if (player.getHeight() != null && player.getWeight() != null &&
                player.getHeight() > 0 && player.getWeight() > 0) {

                double heightInMeters = player.getHeight() / 100.0;
                double bmi = player.getWeight() / (heightInMeters * heightInMeters);

                if (bmi >= 18.5 && bmi <= 24.9) {
                    score += 20; // Healthy BMI
                } else if ((bmi >= 17 && bmi < 18.5) || (bmi > 24.9 && bmi <= 27)) {
                    score += 10; // Slightly off
                }
                // Outside range: +0
            }

            // Age factor
            if (user.getDob() != null) {
                int age = Period.between(user.getDob(), LocalDate.now()).getYears();

                if (age >= 18 && age <= 25) {
                    score += 20; // Peak age
                } else if ((age >= 16 && age < 18) || (age >= 26 && age <= 28)) {
                    score += 15;
                } else if (age >= 29 && age <= 32) {
                    score += 10;
                } else {
                    score += 5;
                }
            }
        } catch (Exception e) {
            log.warn("Error calculating physical score for player {}: {}", player.getId(), e.getMessage());
        }

        return Math.min(100, score);
    }

    /**
     * Calculate Experience score (Kinh nghiệm)
     * Based on years of experience and level
     * Score: 0-100
     */
    public Integer calculateExperienceScore(Player player) {
        int score = 20; // Base score

        try {
            // Years factor
            if (player.getYearsOfExperience() != null) {
                score += Math.min(40, player.getYearsOfExperience() * 8);
            }

            // Level factor
            if (player.getLevel() != null) {
                switch (player.getLevel()) {
                    case CHUYEN_NGHIEP:
                        score += 40;
                        break;
                    case TUYEN_TRE:
                        score += 30;
                        break;
                    case NGHIEP_DU:
                        score += 20;
                        break;
                    case CAU_THU_MOI:
                        score += 10;
                        break;
                }
            }
        } catch (Exception e) {
            log.warn("Error calculating experience score for player {}: {}", player.getId(), e.getMessage());
        }

        return Math.min(100, score);
    }

    /**
     * Calculate Skills score (Kỹ năng)
     * Based on positions and preferred foot
     * Score: 0-100
     */
    public Integer calculateSkillsScore(Player player) {
        int score = 40; // Base score

        try {
            // Position count factor
            if (player.getPositions() != null && !player.getPositions().isEmpty()) {
                String[] positions = player.getPositions().split(",");
                int positionCount = positions.length;

                if (positionCount >= 3) {
                    score += 30;
                } else if (positionCount == 2) {
                    score += 20;
                } else {
                    score += 10;
                }
            }

            // Preferred foot factor
            if (player.getPreferredFoot() != null) {
                if ("both".equalsIgnoreCase(player.getPreferredFoot())) {
                    score += 30;
                } else {
                    score += 20; // left or right
                }
            } else {
                score += 10; // Default if not specified
            }
        } catch (Exception e) {
            log.warn("Error calculating skills score for player {}: {}", player.getId(), e.getMessage());
        }

        return Math.min(100, score);
    }

    /**
     * Calculate Profile Completeness score (Hoàn thiện profile)
     * Based on percentage of filled fields
     * Score: 0-100
     */
    public Integer calculateProfileCompletenessScore(Player player, User user) {
        int totalFields = 12;
        int filledFields = 0;

        // Always filled from registration
        filledFields++; // fullName
        filledFields++; // phone

        // Optional fields
        if (user.getEmail() != null && !user.getEmail().isEmpty()) filledFields++;
        if (user.getDob() != null) filledFields++;
        if (user.getGender() != null) filledFields++;
        if (player.getHeight() != null) filledFields++;
        if (player.getWeight() != null) filledFields++;
        if (player.getPositions() != null && !player.getPositions().isEmpty()) filledFields++;
        if (player.getPreferredFoot() != null) filledFields++;
        if (player.getBio() != null && !player.getBio().isEmpty()) filledFields++;

        // Any one of academy/school/club counts as 1 field
        if ((player.getAcademy() != null && !player.getAcademy().isEmpty()) ||
            (player.getSchool() != null && !player.getSchool().isEmpty()) ||
            (player.getClub() != null && !player.getClub().isEmpty())) {
            filledFields++;
        }

        int score = (int) ((double) filledFields / totalFields * 100);
        return Math.max(20, score); // Minimum 20
    }

    /**
     * Calculate Achievements score (Thành tích)
     * Based on count of APPROVED achievements
     * Score: 0-100
     */
    public Integer calculateAchievementsScore(Player player) {
        int score = 20; // Base score

        try {
            long approvedCount = player.getAchievements().stream()
                    .filter(a -> a.getApprovalStatus() == PlayerAchievement.ApprovalStatus.APPROVED)
                    .count();

            score += (int) Math.min(80, approvedCount * 15);
        } catch (Exception e) {
            log.warn("Error calculating achievements score for player {}: {}", player.getId(), e.getMessage());
        }

        return Math.min(100, score);
    }

    /**
     * Calculate Highlights score
     * Based on count of APPROVED highlights
     * Score: 0-100
     */
    public Integer calculateHighlightsScore(Player player) {
        int score = 20; // Base score

        try {
            long approvedCount = player.getHighlights().stream()
                    .filter(h -> h.getApprovalStatus() == PlayerHighlight.ApprovalStatus.APPROVED)
                    .count();

            score += (int) Math.min(80, approvedCount * 20);
        } catch (Exception e) {
            log.warn("Error calculating highlights score for player {}: {}", player.getId(), e.getMessage());
        }

        return Math.min(100, score);
    }
}
