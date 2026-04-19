package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Coach;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.CoachRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service for managing Coach profiles
 * Handles CRUD operations for coach-specific data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CoachService {

    private final CoachRepository coachRepository;
    private final UserRepository userRepository;

    @Transactional
    public Coach createCoachProfile(Long userId, Coach coachData) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getRole() != User.Role.COACH) {
            throw new IllegalStateException("User role must be COACH. Current role: " + user.getRole());
        }

        if (coachRepository.existsByUserId(userId)) {
            throw new IllegalStateException("Coach profile already exists for user ID: " + userId);
        }

        Coach coach = Coach.builder()
            .user(user)
            .specialization(coachData.getSpecialization())
            .yearsOfExperience(coachData.getYearsOfExperience())
            .certifications(coachData.getCertifications())
            .build();

        Coach savedCoach = coachRepository.save(coach);
        log.info("Created coach profile for user ID: {}", userId);
        return savedCoach;
    }

    public Optional<Coach> getCoachProfile(Long userId) {
        return coachRepository.findByUserId(userId);
    }

    @Transactional
    public Coach updateCoachProfile(Long userId, Coach updatedData) {
        Coach coach = coachRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Coach profile not found for user ID: " + userId));

        coach.setSpecialization(updatedData.getSpecialization());
        coach.setYearsOfExperience(updatedData.getYearsOfExperience());
        coach.setCertifications(updatedData.getCertifications());

        Coach savedCoach = coachRepository.save(coach);
        log.info("Updated coach profile for user ID: {}", userId);
        return savedCoach;
    }

    @Transactional
    public void deleteCoachProfile(Long userId) {
        Coach coach = coachRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Coach profile not found for user ID: " + userId));

        coachRepository.delete(coach);
        log.info("Deleted coach profile for user ID: {}", userId);
    }
}
