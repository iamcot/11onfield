package com.elevenof.backoffice.service;

import com.elevenof.backoffice.dto.response.CombineDTO;
import org.springframework.stereotype.Service;

/**
 * Reads the Combine result of a player (task 2.4 fills it from {@code player_combine_summary}). Until then there is
 * nothing to show, and the profile page falls back to placeholder data in development only.
 */
@Service
public class CombineService {

    /** Everything stored for the player, before visibility is applied; null when the player has no Combine result. */
    public CombineDTO findFull(Long userId) {
        return null;
    }
}
