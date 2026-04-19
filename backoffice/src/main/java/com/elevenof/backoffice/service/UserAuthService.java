package com.elevenof.backoffice.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.elevenof.backoffice.dto.request.LoginRequest;
import com.elevenof.backoffice.dto.request.PlayerProfileRequest;
import com.elevenof.backoffice.dto.request.RegisterRequest;
import com.elevenof.backoffice.dto.response.AuthResponse;
import com.elevenof.backoffice.dto.response.TokenResponse;
import com.elevenof.backoffice.dto.response.UserResponse;
import com.elevenof.backoffice.exception.InvalidCredentialsException;
import com.elevenof.backoffice.exception.UserAlreadyExistsException;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.UserRepository;
import com.elevenof.backoffice.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.security.SecureRandom;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserAuthService {

    private final UserRepository userRepository;
    private final PlayerService playerService;
    private final AddressService addressService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final Random random = new SecureRandom();

    /**
     * Generate a unique 16-character userid
     */
    private String generateUserid() {
        String characters = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder userid = new StringBuilder(16);

        // Generate until we find a unique userid
        do {
            userid.setLength(0);
            for (int i = 0; i < 16; i++) {
                userid.append(characters.charAt(random.nextInt(characters.length())));
            }
        } while (userRepository.existsByUserid(userid.toString()));

        return userid.toString();
    }

    public AuthResponse register(RegisterRequest request) {
        // Validate phone uniqueness
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new UserAlreadyExistsException("Số điện thoại đã được sử dụng");
        }

        // Validate email uniqueness (if provided)
        // if (request.getEmail() != null && !request.getEmail().isEmpty()
        // && userRepository.existsByEmail(request.getEmail())) {
        // throw new UserAlreadyExistsException("Email đã được sử dụng");
        // }

        // Create User
        User user = User.builder()
                .phone(request.getPhone())
                .userid(generateUserid())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered: {}", savedUser.getPhone());

        // Create Address with selected province
        if (request.getProvinceId() != null) {
            addressService.createAddress(savedUser, request.getProvinceId());
            log.info("Address created for user: {}", savedUser.getId());
        }

        // Create Player profile if role is PLAYER
        if (savedUser.getRole() == User.Role.PLAYER && request.getPlayerProfile() != null) {
            PlayerProfileRequest profile = request.getPlayerProfile();
            Player player = Player.builder()
                    .user(savedUser)
                    .positions(profile.getPositions() != null ? String.join(",", profile.getPositions()) : null)
                    .height(profile.getHeight())
                    .weight(profile.getWeight())
                    .preferredFoot(profile.getPreferredFoot())
                    .build();
            playerService.createPlayerProfile(savedUser.getId(), player);
            log.info("Player profile created for user: {}", savedUser.getId());
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser);

        return AuthResponse.builder()
                .user(mapToUserResponse(savedUser))
                .tokens(TokenResponse.builder()
                        .accessToken(token)
                        .expiresIn(86400L)
                        .build())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by phone
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new InvalidCredentialsException("Số điện thoại hoặc mật khẩu không đúng"));

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Số điện thoại hoặc mật khẩu không đúng");
        }

        // Check if account is enabled
        if (!user.getEnabled()) {
            throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa");
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user);

        log.info("User logged in: {}", user.getPhone());

        return AuthResponse.builder()
                .user(mapToUserResponse(user))
                .tokens(TokenResponse.builder()
                        .accessToken(token)
                        .expiresIn(86400L)
                        .build())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .userid(user.getUserid())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
