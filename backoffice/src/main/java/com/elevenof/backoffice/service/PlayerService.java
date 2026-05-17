package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.PlayerRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service for managing Player profiles
 * Handles CRUD operations for player-specific data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;

    @Transactional
    public Player createPlayerProfile(Long userId, Player playerData) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getRole() != User.Role.PLAYER) {
            throw new IllegalStateException("User role must be PLAYER. Current role: " + user.getRole());
        }

        if (playerRepository.existsByUserId(userId)) {
            throw new IllegalStateException("Player profile already exists for user ID: " + userId);
        }

        Player player = Player.builder()
            .user(user)
            .positions(playerData.getPositions())
            .height(playerData.getHeight())
            .weight(playerData.getWeight())
            .preferredFoot(playerData.getPreferredFoot())
            .level(playerData.getLevel())
            .bio(playerData.getBio())
            .personalId(playerData.getPersonalId())
            .school(playerData.getSchool())
            .academy(playerData.getAcademy())
            .club(playerData.getClub())
            .achievements(playerData.getAchievements() != null ? new java.util.ArrayList<>(playerData.getAchievements()) : new java.util.ArrayList<>())
            .highlights(playerData.getHighlights() != null ? new java.util.ArrayList<>(playerData.getHighlights()) : new java.util.ArrayList<>())
            .socials(playerData.getSocials() != null ? new java.util.ArrayList<>(playerData.getSocials()) : new java.util.ArrayList<>())
            .build();

        // Fix player references in child entities (they were referencing the transient playerData)
        for (com.elevenof.backoffice.model.PlayerAchievement ach : player.getAchievements()) {
            ach.setPlayer(player);
        }
        for (com.elevenof.backoffice.model.PlayerHighlight highlight : player.getHighlights()) {
            highlight.setPlayer(player);
        }
        for (com.elevenof.backoffice.model.PlayerSocial social : player.getSocials()) {
            social.setPlayer(player);
        }

        Player savedPlayer = playerRepository.save(player);
        log.info("Created player profile for user ID: {} with extended fields (level: {}, school: {}, academy: {}, club: {}, achievements: {}, highlights: {}, socials: {})",
            userId, player.getLevel(), player.getSchool(), player.getAcademy(), player.getClub(),
            player.getAchievements().size(), player.getHighlights().size(), player.getSocials().size());
        return savedPlayer;
    }

    public Optional<Player> getPlayerProfile(Long userId) {
        return playerRepository.findByUserId(userId);
    }

    /**
     * Get player profile with all lazy collections eagerly loaded
     * Use this when you need to access achievements, highlights, or socials
     */
    public Optional<Player> getPlayerProfileWithCollections(Long userId) {
        return playerRepository.findByUserIdWithCollections(userId);
    }

    @Transactional
    public Player updatePlayerProfile(Long userId, Player updatedData) {
        Player player = playerRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Player profile not found for user ID: " + userId));

        player.setPositions(updatedData.getPositions());
        player.setHeight(updatedData.getHeight());
        player.setWeight(updatedData.getWeight());
        player.setPreferredFoot(updatedData.getPreferredFoot());

        Player savedPlayer = playerRepository.save(player);
        log.info("Updated player profile for user ID: {}", userId);
        return savedPlayer;
    }

    @Transactional
    public void deletePlayerProfile(Long userId) {
        Player player = playerRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Player profile not found for user ID: " + userId));

        playerRepository.delete(player);
        log.info("Deleted player profile for user ID: {}", userId);
    }

    @Transactional
    public Player updatePlayerProfile(Player player) {
        Player savedPlayer = playerRepository.save(player);
        log.info("Updated player profile for player ID: {}", player.getId());
        return savedPlayer;
    }
}
