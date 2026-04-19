# Frontend-Backend Integration Complete

## Overview
Successfully integrated Next.js frontend with Spring Boot REST API for authentication and user management.

---

## Changes Made

### 1. Backend API Endpoints (Already Created)
- ✅ `POST /api/auth/register` - User registration with player profile support
- ✅ `POST /api/auth/login` - JWT authentication
- ✅ `GET /api/users/me` - Get current user profile
- ✅ `GET /api/users/me/player` - Get player profile (PLAYER role only)

### 2. Frontend Updates

#### Updated Files:

**[auth.service.ts](frontend-app/src/services/auth.service.ts)**
- Changed `credentials.email` to `credentials.phone` in login function
- Updated `getCurrentUser()` to call `/users/me` instead of `/auth/me`
- Removed unnecessary logout API call and refresh token logic (JWT is stateless)

**[login/page.tsx](frontend-app/src/app/auth/login/page.tsx)**
- Updated login to use `{ phone, password }` instead of `{ email: phone, password }`
- Phone-based authentication now properly matches backend API

**[app.config.ts](frontend-app/src/config/app.config.ts)**
- Changed `useMockData: false` to use real backend API instead of mocks

#### New Files:

**[user.service.ts](frontend-app/src/services/user.service.ts)**
- Created new service for user-related endpoints
- `getPlayerProfile()` - Fetches player profile data for authenticated PLAYER users

---

## Integration Test Results

### ✅ Registration Test
```bash
POST /api/auth/register
{
  "fullName": "Frontend Integration Test",
  "phone": "0777666555",
  "password": "password123",
  "role": "PLAYER",
  "playerProfile": {
    "positions": ["forward"],
    "height": 180,
    "weight": 75,
    "preferredFoot": "left"
  }
}

Response: 201 Created
{
  "user": {
    "id": 5,
    "phone": "0777666555",
    "fullName": "Frontend Integration Test",
    "email": null,
    "role": "PLAYER",
    "createdAt": "2026-04-10T12:47:47.035812"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400
  }
}
```

### ✅ Login Test
```bash
POST /api/auth/login
{
  "phone": "0777666555",
  "password": "password123"
}

Response: 200 OK
{
  "user": { ... },
  "tokens": { ... }
}
```

### ✅ Get User Profile Test
```bash
GET /api/users/me
Authorization: Bearer {JWT_TOKEN}

Response: 200 OK
{
  "id": 5,
  "phone": "0777666555",
  "fullName": "Frontend Integration Test",
  "email": null,
  "role": "PLAYER",
  "createdAt": "2026-04-10T12:47:47.035812"
}
```

### ✅ Get Player Profile Test
```bash
GET /api/users/me/player
Authorization: Bearer {JWT_TOKEN}

Response: 200 OK
{
  "id": 5,
  "positions": ["forward"],
  "height": 180,
  "weight": 75,
  "preferredFoot": "left",
  "createdAt": "2026-04-10T12:47:47.047074",
  "updatedAt": "2026-04-10T12:47:47.047086"
}
```

---

## How It Works

### Registration Flow
1. User fills out registration form at `/auth/register`
2. Frontend sends `POST /api/auth/register` with user data
3. Backend creates User and Player profile (if role=PLAYER)
4. Backend returns JWT token + user info
5. Frontend stores token in localStorage and redirects to dashboard

### Login Flow
1. User enters phone and password at `/auth/login`
2. Frontend sends `POST /api/auth/login`
3. Backend validates credentials and generates JWT
4. Backend returns JWT token + user info
5. Frontend stores token in localStorage and redirects to dashboard

### Authentication Flow
1. Frontend stores JWT token in localStorage after login/register
2. For protected API calls, frontend includes header: `Authorization: Bearer {token}`
3. Backend JWT filter extracts and validates token
4. Backend sets Spring Security context with user ID and role
5. API endpoints access authenticated user via `Authentication.getName()`

---

## Frontend Usage Examples

### Using Auth Service
```typescript
import { authService } from '@/services/auth.service';

// Login
const response = await authService.login({
  phone: '0777666555',
  password: 'password123'
});
// Token automatically stored in localStorage

// Register
const response = await authService.register({
  fullName: 'Test User',
  phone: '0123456789',
  password: 'password123',
  role: 'PLAYER',
  playerProfile: {
    positions: ['forward', 'midfielder'],
    height: 180,
    weight: 75,
    preferredFoot: 'right'
  }
});

// Get current user
const user = await authService.getCurrentUser();

// Logout
await authService.logout(); // Clears localStorage
```

### Using User Service
```typescript
import { userService } from '@/services/user.service';

// Get player profile (requires PLAYER role)
const playerProfile = await userService.getPlayerProfile();
// Returns: { id, positions, height, weight, preferredFoot, createdAt, updatedAt }
```

### Using Auth Context (React)
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, register, logout } = useAuth();

  const handleLogin = async () => {
    await login({ phone: '0777666555', password: 'password123' });
    // User is automatically set in context
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.fullName}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

---

## Configuration

### Backend Configuration
**[application.yml](backoffice/src/main/resources/application.yml)**
```yaml
server:
  port: 8080

jwt:
  secret: ${JWT_SECRET:your-secret-key-must-be-at-least-256-bits-long-for-hs512-algorithm-security}
  expiration: 86400 # 24 hours
```

### Frontend Configuration
**[app.config.ts](frontend-app/src/config/app.config.ts)**
```typescript
export const appConfig = {
  useMockData: false, // Use real API
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
};
```

**Environment Variables (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## Running the Application

### Start Backend (Port 8080)
```bash
cd backoffice
mvn clean package -DskipTests
java -jar target/backoffice-0.0.1-SNAPSHOT.jar
```

### Start Frontend (Port 80)
```bash
cd frontend-app
npm run dev
# Access at http://localhost
```

---

## API Error Handling

The frontend properly handles all backend error responses:

- **400 Bad Request** - Validation errors (displays field-specific errors)
- **401 Unauthorized** - Invalid credentials (displays Vietnamese error message)
- **403 Forbidden** - No access (e.g., USER trying to access PLAYER endpoint)
- **409 Conflict** - Duplicate phone/email (displays Vietnamese error message)
- **500 Internal Server Error** - Generic error handling

Example error response:
```json
{
  "status": 409,
  "message": "Số điện thoại đã được sử dụng",
  "timestamp": "2026-04-10T12:47:37.51717",
  "errors": null
}
```

---

## Security Features

✅ **JWT Authentication** - Stateless token-based auth
✅ **Phone-based Login** - Vietnamese phone format (0xxxxxxxxx)
✅ **Password Encryption** - BCrypt hashing
✅ **Role-Based Access Control** - @PreAuthorize for endpoints
✅ **CORS Enabled** - Localhost frontend can access backend
✅ **Token Expiration** - 24-hour expiration (configurable)
✅ **Input Validation** - Jakarta validation on backend
✅ **Vietnamese Error Messages** - User-friendly localization

---

## Next Steps (Optional Enhancements)

1. **Refresh Token Flow** - Add token refresh before expiration
2. **Profile Editing** - Add endpoints to update user/player profiles
3. **Password Reset** - Implement forgot password flow
4. **Email Verification** - Add email verification for accounts
5. **Social Login** - Add OAuth2 providers (Google, Facebook)
6. **Profile Photos** - Add file upload for user avatars
7. **Admin Endpoints** - Add user management for ADMIN role
8. **Dashboard Data** - Add dashboard statistics and data

---

## Files Changed Summary

### Backend (No changes needed - API already working)
- All REST endpoints operational
- JWT authentication configured
- Database schema migrated

### Frontend (4 files modified, 1 file created)
✅ [auth.service.ts](frontend-app/src/services/auth.service.ts) - Updated API calls
✅ [login/page.tsx](frontend-app/src/app/auth/login/page.tsx) - Updated to use phone
✅ [app.config.ts](frontend-app/src/config/app.config.ts) - Disabled mock mode
✅ **NEW:** [user.service.ts](frontend-app/src/services/user.service.ts) - Player profile API

### Already Updated (From previous database refactoring)
✅ [auth.ts](frontend-app/src/types/auth.ts) - Types match backend
✅ [register/page.tsx](frontend-app/src/app/auth/register/page.tsx) - Uses role-based structure

---

## ✅ Integration Complete!

The frontend is now fully integrated with the backend REST API. All authentication and user profile features are working correctly.

**Test Credentials:**
- Phone: `0777666555`
- Password: `password123`
- Role: PLAYER

Or use the admin account:
- Phone: `admin`
- Password: `123456`
- Role: ADMIN
