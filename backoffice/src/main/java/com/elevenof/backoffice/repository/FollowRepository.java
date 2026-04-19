package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Follow;
import com.elevenof.backoffice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByFollowerIdAndFollowedId(Long followerId, Long followedId);

    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);

    long countByFollowedId(Long followedId);

    long countByFollowerId(Long followerId);

    @Query("SELECT f.followed FROM Follow f WHERE f.follower.id = :followerId AND f.followed.role = 'PLAYER'")
    List<User> findFollowedPlayersByFollowerId(@Param("followerId") Long followerId);

    @Query("SELECT f.follower FROM Follow f WHERE f.followed.id = :followedId")
    List<User> findFollowersByFollowedId(@Param("followedId") Long followedId);

    void deleteByFollowerIdAndFollowedId(Long followerId, Long followedId);
}
