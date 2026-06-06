package com.elevenof.backoffice.model;

public enum CompetitionStatus {
    DRAFT,                  // Competition created but not yet open
    REGISTRATION_OPEN,      // Registration period active
    REGIONAL_AUDITION,      // Regional auditions in progress
    SELECTING_TOP30,        // Admin selecting TOP 30
    TRAINING_PHASE,         // Training episodes phase
    FINAL_PHASE,            // Final match phase
    COMPLETED               // Competition finished
}
