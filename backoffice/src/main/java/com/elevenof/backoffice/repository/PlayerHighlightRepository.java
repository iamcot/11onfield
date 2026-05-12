package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.PlayerHighlight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerHighlightRepository extends JpaRepository<PlayerHighlight, Long> {

    List<PlayerHighlight> findByPlayerIdOrderByCreatedAtDesc(Long playerId);

    void deleteByPlayerId(Long playerId);
}
