package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.PlayerHighlight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerHighlightRepository extends JpaRepository<PlayerHighlight, Long> {

    List<PlayerHighlight> findByPlayerIdOrderByCreatedAtDesc(Long playerId);

    @Modifying
    @Query("DELETE FROM PlayerHighlight ph WHERE ph.player.id = :playerId")
    void deleteByPlayerId(@Param("playerId") Long playerId);
}
