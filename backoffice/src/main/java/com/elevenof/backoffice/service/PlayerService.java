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
            .build();

        Player savedPlayer = playerRepository.save(player);
        log.info("Created player profile for user ID: {}", userId);
        return savedPlayer;
    }

    public Optional<Player> getPlayerProfile(Long userId) {
        return playerRepository.findByUserId(userId);
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
