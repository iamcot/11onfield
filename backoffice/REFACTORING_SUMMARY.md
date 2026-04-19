# Backoffice Refactoring Summary

## Overview
Successfully refactored the project from "api" to "backoffice" with proper routing structure for both REST API and Admin UI.

## Changes Made

### 1. Package Structure Renamed
**Old:** `com.elevenof.api`
**New:** `com.elevenof.backoffice`

All Java files have been updated:
- Package declarations: `package com.elevenof.backoffice.*`
- Import statements: `import com.elevenof.backoffice.*`

### 2. Main Application Class
**Old:** `BackendApiApplication.java`
**New:** `BackofficeApplication.java`

Located at: `src/main/java/com/elevenof/backoffice/BackofficeApplication.java`

### 3. Controller Structure
```
controller/
├── api/                    # REST API controllers (for frontend app)
│   └── HealthController.java
└── admin/                  # Admin UI controllers (Thymeleaf)
    └── AdminController.java
```

### 4. Routing Structure

#### REST API Routes (for frontend app)
Base path: `/api`

- `GET /api/health` - Health check endpoint
- `POST /api/auth/login` - User login (to be implemented)
- `POST /api/auth/register` - User registration (to be implemented)
- `POST /api/auth/refresh` - Refresh token (to be implemented)
- All future API endpoints should be under `/api/**`

#### Admin UI Routes (server-side rendered)
Base path: `/admin`

- `GET /admin/` or `/admin/dashboard` - Dashboard
- `GET /admin/players` - Players management
- `GET /admin/matches` - Matches management
- `GET /admin/events` - Events management
- `GET /admin/users` - Users & ACL management
- `GET /admin/login` - Admin login page (to be secured)

### 5. Maven Configuration (pom.xml)
Updated:
- `<artifactId>backoffice</artifactId>`
- `<name>backoffice</name>`
- `<description>Backoffice application with REST API and Admin UI</description>`

Added dependencies:
- `spring-boot-starter-thymeleaf` - For admin UI templates
- `thymeleaf-extras-springsecurity6` - For Thymeleaf security integration

### 6. Application Configuration (application.yml)

#### Main Changes:
- Removed `server.servlet.context-path: /api` (no longer needed)
- Changed `spring.application.name` to `backoffice`
- Added Thymeleaf configuration
- Updated logging package to `com.elevenof.backoffice`

#### Routes Now Available:
- **http://localhost:8080/api/*** - REST API endpoints
- **http://localhost:8080/admin/*** - Admin UI pages
- **http://localhost:8080/api/health** - Health check

### 7. Environment-Specific Configs
Updated logging in:
- `application-dev.yml` → `com.elevenof.backoffice: DEBUG`
- `application-prod.yml` → `com.elevenof.backoffice: INFO`

## Directory Structure

```
backoffice/
├── src/
│   ├── main/
│   │   ├── java/com/elevenof/backoffice/
│   │   │   ├── BackofficeApplication.java
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   │   ├── api/              # REST API controllers
│   │   │   │   │   └── HealthController.java
│   │   │   │   └── admin/            # Admin MVC controllers
│   │   │   │       └── AdminController.java
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── model/
│   │   │   ├── dto/
│   │   │   ├── exception/
│   │   │   └── security/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── templates/            # Thymeleaf templates
│   │       │   ├── fragments/
│   │       │   │   └── layout.html
│   │       │   └── admin/
│   │       │       ├── login.html
│   │       │       ├── dashboard.html
│   │       │       ├── players.html
│   │       │       ├── matches.html
│   │       │       ├── events.html
│   │       │       └── users.html
│   │       └── static/               # Static resources
│   │           └── admin/
│   │               ├── css/
│   │               │   └── custom.css
│   │               └── js/
│   │                   └── custom.js
│   └── test/
└── pom.xml
```

## Testing

After starting the application with `mvn spring-boot:run`, you can test:

1. **Health Check (REST API)**
   ```bash
   curl http://localhost:8080/api/health
   # Expected: {"status":"UP","service":"backoffice"}
   ```

2. **Admin Dashboard (Browser)**
   - Navigate to: http://localhost:8080/admin/dashboard
   - Should show AdminLTE dashboard

3. **All Admin Pages**
   - http://localhost:8080/admin/players
   - http://localhost:8080/admin/matches
   - http://localhost:8080/admin/events
   - http://localhost:8080/admin/users

## Next Steps

### 1. Configure Spring Security
Update `SecurityConfig.java` to handle two authentication types:
- **JWT for /api/*** - OAuth2 Resource Server (for frontend app)
- **Session for /admin/*** - Form login (for admin users)

Example:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())
            .build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/admin/**")
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/admin/login").permitAll()
                .requestMatchers("/admin/**").hasAnyRole("ADMIN", "SUPER_USER")
            )
            .formLogin(form -> form
                .loginPage("/admin/login")
                .defaultSuccessUrl("/admin/dashboard")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/admin/logout")
                .logoutSuccessUrl("/admin/login?logout")
            )
            .build();
    }
}
```

### 2. Update CORS Configuration
Update allowed origins to match frontend port 80:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList("http://localhost", "http://localhost:80"));
    // ... rest of config
}
```

### 3. Implement REST API Controllers
Create controllers under `controller/api/`:
- `AuthController.java` - Login, register, refresh endpoints
- `UserController.java` - User management API
- `PlayerController.java` - Player API
- `MatchController.java` - Match API
- `EventController.java` - Event API

### 4. Connect Admin UI to Real Data
Update `AdminController.java` methods to:
- Inject services
- Fetch data from database
- Pass data to Thymeleaf templates
- Handle form submissions

## Benefits of New Structure

✅ **Clear Separation**: API and Admin routes are clearly separated
✅ **Flexible Auth**: Different authentication strategies for different use cases
✅ **Maintainable**: Easy to understand which controllers serve which purpose
✅ **Scalable**: Easy to add new endpoints in either `/api` or `/admin`
✅ **RESTful**: API follows REST conventions without context path interference
✅ **Modern**: Server-side rendering for admin, REST API for frontend

---

All refactoring is complete! The project is ready for further development. 🎉
