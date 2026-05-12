package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.PlayerSocial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerSocialRepository extends JpaRepository<PlayerSocial, Long> {

    List<PlayerSocial> findByPlayerIdOrderByCreatedAtDesc(Long playerId);

    @Modifying
    @Query("DELETE FROM PlayerSocial ps WHERE ps.player.id = :playerId")
    void deleteByPlayerId(@Param("playerId") Long playerId);
}
