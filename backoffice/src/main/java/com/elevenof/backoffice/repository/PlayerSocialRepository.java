package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.PlayerSocial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerSocialRepository extends JpaRepository<PlayerSocial, Long> {

    List<PlayerSocial> findByPlayerIdOrderByCreatedAtDesc(Long playerId);

    void deleteByPlayerId(Long playerId);
}
