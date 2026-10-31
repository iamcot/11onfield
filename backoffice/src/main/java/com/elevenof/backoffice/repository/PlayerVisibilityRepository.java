package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.DataGroup;
import com.elevenof.backoffice.model.PlayerVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerVisibilityRepository extends JpaRepository<PlayerVisibility, Long> {

    List<PlayerVisibility> findByUserId(Long userId);

    Optional<PlayerVisibility> findByUserIdAndDataGroup(Long userId, DataGroup dataGroup);
}
