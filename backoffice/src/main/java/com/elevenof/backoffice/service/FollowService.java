package com.elevenof.backoffice.service;

import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.Follow;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.FollowRepository;
import com.elevenof.backoffice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    @Transactional
    public void followUser(Long followerId, String targetUserid) {
        User follower = userRepository.findById(followerId)
            .orElseThrow(() -> new ResourceNotFoundException("Follower not found"));

        User followed = userRepository.findByUserid(targetUserid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserid));

        // Cannot follow yourself
        if (follower.getId().equals(followed.getId())) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        // Check if already following
        if (followRepository.existsByFollowerIdAndFollowedId(followerId, followed.getId())) {
            log.info("User {} is already following user {}", followerId, targetUserid);
            return; // Idempotent - do nothing if already following
        }

        Follow follow = Follow.builder()
            .follower(follower)
            .followed(followed)
            .build();

        followRepository.save(follow);
        log.info("User {} started following user {}", followerId, targetUserid);
    }

    @Transactional
    public void unfollowUser(Long followerId, String targetUserid) {
        User followed = userRepository.findByUserid(targetUserid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserid));

        followRepository.deleteByFollowerIdAndFollowedId(followerId, followed.getId());
        log.info("User {} unfollowed user {}", followerId, targetUserid);
    }

    public boolean isFollowing(Long followerId, String targetUserid) {
        User followed = userRepository.findByUserid(targetUserid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserid));

        return followRepository.existsByFollowerIdAndFollowedId(followerId, followed.getId());
    }

    public long getFollowersCount(Long userId) {
        return followRepository.countByFollowedId(userId);
    }

    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerId(userId);
    }

    public List<User> getFollowedPlayers(Long userId) {
        return followRepository.findFollowedPlayersByFollowerId(userId);
    }

    public List<User> getFollowers(Long userId) {
        return followRepository.findFollowersByFollowedId(userId);
    }
}
