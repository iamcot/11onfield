package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Scouter;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.ScouterRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service for managing Scouter profiles
 * Handles CRUD operations for scouter-specific data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScouterService {

    private final ScouterRepository scouterRepository;
    private final UserRepository userRepository;

    @Transactional
    public Scouter createScouterProfile(Long userId, Scouter scouterData) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getRole() != User.Role.SCOUTER) {
            throw new IllegalStateException("User role must be SCOUTER. Current role: " + user.getRole());
        }

        if (scouterRepository.existsByUserId(userId)) {
            throw new IllegalStateException("Scouter profile already exists for user ID: " + userId);
        }

        Scouter scouter = Scouter.builder()
            .user(user)
            .territory(scouterData.getTerritory())
            .specialization(scouterData.getSpecialization())
            .yearsOfExperience(scouterData.getYearsOfExperience())
            .build();

        Scouter savedScouter = scouterRepository.save(scouter);
        log.info("Created scouter profile for user ID: {}", userId);
        return savedScouter;
    }

    public Optional<Scouter> getScouterProfile(Long userId) {
        return scouterRepository.findByUserId(userId);
    }

    @Transactional
    public Scouter updateScouterProfile(Long userId, Scouter updatedData) {
        Scouter scouter = scouterRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Scouter profile not found for user ID: " + userId));

        scouter.setTerritory(updatedData.getTerritory());
        scouter.setSpecialization(updatedData.getSpecialization());
        scouter.setYearsOfExperience(updatedData.getYearsOfExperience());

        Scouter savedScouter = scouterRepository.save(scouter);
        log.info("Updated scouter profile for user ID: {}", userId);
        return savedScouter;
    }

    @Transactional
    public void deleteScouterProfile(Long userId) {
        Scouter scouter = scouterRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Scouter profile not found for user ID: " + userId));

        scouterRepository.delete(scouter);
        log.info("Deleted scouter profile for user ID: {}", userId);
    }
}
