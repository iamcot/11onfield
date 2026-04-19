# Backoffice

Spring Boot application serving both REST API and admin UI for the 11of platform.

## Tech Stack
- Java 17
- Spring Boot 3.2.3
- Spring Security with OAuth2 (for API)
- Spring MVC + Thymeleaf (for admin UI)
- Spring Data JPA
- MySQL 8.x
- Maven

## Components

### 1. REST API
- OAuth2 authentication with JWT tokens
- RESTful endpoints for frontend app
- Base URL: `http://localhost:8080/api`

### 2. Admin UI
- Server-side rendered Thymeleaf pages
- Session-based authentication
- Base URL: `http://localhost:8080/admin`
- Role-based access (ADMIN, SUPER_USER)

## Prerequisites
- Java 17 or higher
- Maven 3.8+
- MySQL 8.x

## Database Setup

```sql
CREATE DATABASE elevenof_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE elevenof_db_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Configuration

Create a `.env` file or set environment variables:

```
DB_USERNAME=root
DB_PASSWORD=your_password
JWT_ISSUER_URI=http://localhost:8080
JWT_JWK_SET_URI=http://localhost:8080/.well-known/jwks.json
```

## Running the Application

### Development
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Production
```bash
mvn clean package
java -jar target/api-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

## API Endpoints

Base URL: `http://localhost:8080/api`

### Health Check
- `GET /health` - Check service health (public)

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh token

## Admin UI Routes

Base URL: `http://localhost:8080/admin`

### Admin Pages
- `GET /admin/login` - Admin login page
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - User management
- `GET /admin/players` - Player management
- `GET /admin/events` - Event management
- `GET /admin/matches` - Match management

## Project Structure

```
backoffice/
├── src/
│   ├── main/
│   │   ├── java/com/elevenof/api/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # Controllers (API + Admin MVC)
│   │   │   │   ├── api/         # REST API controllers
│   │   │   │   └── admin/       # Admin UI controllers (Thymeleaf)
│   │   │   ├── service/         # Business logic
│   │   │   ├── repository/      # Data access layer
│   │   │   ├── model/           # JPA entities
│   │   │   ├── dto/             # Data transfer objects
│   │   │   ├── exception/       # Custom exceptions
│   │   │   └── security/        # Security components
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── templates/       # Thymeleaf templates
│   │       └── static/          # CSS, JS, images
│   └── test/
└── pom.xml
```

## CORS Configuration

Currently configured to allow:
- Frontend app: `http://localhost:80`

Update `SecurityConfig.java` to add more origins as needed.

## Authentication Strategy

### For Frontend API
- OAuth2 with JWT tokens
- Stateless authentication
- Token-based authorization

### For Admin UI
- Session-based authentication
- Server-side session management
- Cookie-based authorization
- CSRF protection enabled
