# 11of Project

Football (soccer) management platform with public-facing frontend and admin backoffice.

## Project Structure

```
11of/
├── backoffice/           # Spring Boot application (REST API + Admin UI)
├── frontend-app/         # Next.js end-user application
└── README.md
```

## Architecture

### Backoffice (Port 8080)
- **Technology**: Spring Boot 3.2.3, Java 17, Thymeleaf
- **Database**: MySQL 8.x
- **Authentication**:
  - REST API: OAuth2 with JWT (for frontend-app)
  - Admin UI: Session-based authentication
- **Purpose**:
  - REST API endpoints for frontend app
  - Server-side rendered admin pages (Thymeleaf)
  - Core business logic and database access

### Frontend App (Port 80)
- **Technology**: Next.js 14, React 18, TypeScript
- **Purpose**: Public-facing user interface for players and events
- **Authentication**: OAuth2 JWT tokens from backoffice API

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.x
- Maven 3.8+

### 1. Setup Backoffice (API + Admin UI)

```bash
cd backoffice

# Create databases
mysql -u root -p
CREATE DATABASE elevenof_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE elevenof_db_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Run application
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Backoffice will be available at:
- Admin UI: `http://localhost:8080/admin`
- REST API: `http://localhost:8080/api`

### 2. Setup Frontend App

```bash
cd frontend-app
npm install

# Run with sudo (port 80 requires elevated permissions on Unix)
sudo npm run dev
```

Frontend will be available at: `http://localhost:80`

## API Integration

The frontend app consumes REST API from the backoffice:
- Base URL: `http://localhost:8080/api`
- Authentication: OAuth2 Bearer tokens (JWT)
- CORS: Configured for frontend (port 80)

## Environment Variables

### Backoffice
```
DB_USERNAME=root
DB_PASSWORD=your_password
JWT_ISSUER_URI=http://localhost:8080
JWT_JWK_SET_URI=http://localhost:8080/.well-known/jwks.json
```

### Frontend App
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Development Workflow

1. Start backoffice application first (includes API)
2. Start frontend application
3. Frontend communicates with backoffice via REST API
4. Admin accesses backoffice UI directly for management
5. Changes in backoffice require Maven rebuild
6. Frontend has hot reload enabled

## Security

- OAuth2 authentication on API endpoints (except /health)
- Session-based authentication for admin UI
- Role-based access control (RBAC)
- JWT tokens with secure validation for frontend
- CORS protection
- SQL injection prevention via JPA
- Input validation on all endpoints
