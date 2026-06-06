package com.elevenof.backoffice.model;

public enum ParticipantStatus {
    REGISTERED,             // Registered for competition
    CHECKED_IN,             // Checked in at selected region
    SELECTED_TOP30,         // Selected for TOP 30 (training phase)
    SELECTED_TOP11,         // Selected for TOP 11 (final)
    ELIMINATED,             // Not selected/eliminated
    WITHDRAWN               // Participant withdrew
}
