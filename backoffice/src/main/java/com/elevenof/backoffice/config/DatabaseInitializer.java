package com.elevenof.backoffice.config;

import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer {

    private final AuthenticationService authenticationService;

    @Bean
    public CommandLineRunner initializeDatabase() {
        return args -> {
            // Check if admin user already exists
            if (!authenticationService.existsByPhone("admin")) {
                // Create default admin user
                User admin = User.builder()
                        .phone("admin")
                        .fullName("Administrator")
                        .email("admin@11of.com")
                        .password("123456") // Will be encoded by the service
                        .role(User.Role.ADMIN)
                        .enabled(true)
                        .accountNonExpired(true)
                        .accountNonLocked(true)
                        .credentialsNonExpired(true)
                        .build();

                authenticationService.createUser(admin);

                log.info("========================================");
                log.info("Default admin user created:");
                log.info("Phone: admin");
                log.info("Password: 123456");
                log.info("========================================");
            } else {
                log.info("Admin user already exists, skipping initialization");
            }
        };
    }
}
