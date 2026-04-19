# Database Refactoring Complete - Backend & Frontend Updates

## Overview
Successfully refactored the User model to separate role-specific data into dedicated tables (Player, Coach, Scouter) and renamed `username` to `phone` for better semantic clarity.

---

## ✅ Backend Changes (Spring Boot)

### 1. New Entity Models Created

#### Player Entity
- **File**: [Player.java](src/main/java/com/elevenof/backoffice/model/Player.java)
- **Fields**: positions, height, weight, preferredFoot
- **Relationship**: @OneToOne with User via @MapsId

#### Coach Entity
- **File**: [Coach.java](src/main/java/com/elevenof/backoffice/model/Coach.java)
- **Fields**: specialization, yearsOfExperience, certifications
- **Relationship**: @OneToOne with User via @MapsId

#### Scouter Entity
- **File**: [Scouter.java](src/main/java/com/elevenof/backoffice/model/Scouter.java)
- **Fields**: territory, specialization, yearsOfExperience
- **Relationship**: @OneToOne with User via @MapsId

### 2. New Repositories Created

- **PlayerRepository**: CRUD operations for player profiles
- **CoachRepository**: CRUD operations for coach profiles
- **ScouterRepository**: CRUD operations for scouter profiles

Each repository includes:
- `findByUserId(Long userId)` - Find profile by user ID
- `existsByUserId(Long userId)` - Check if profile exists

### 3. New Services Created

- **PlayerService**: Create, read, update, delete player profiles
- **CoachService**: Create, read, update, delete coach profiles
- **ScouterService**: Create, read, update, delete scouter profiles

All services include role validation to ensure only users with the correct role can have a profile.

### 4. User Entity Updated

**File**: [User.java](src/main/java/com/elevenof/backoffice/model/User.java)

**Changes**:
- ✅ Renamed `username` → `phone` (VARCHAR(20) to support phone numbers OR special strings like "admin")
- ✅ Removed player-specific fields: `isPlayer`, `positions`, `height`, `weight`, `preferredFoot`
- ✅ Expanded Role enum:
  ```java
  public enum Role {
      USER,         // Basic user, no special profile
      PLAYER,       // Player with player profile
      COACH,        // Coach with coach profile
      SCOUTER,      // Scouter with scouter profile
      EDITOR,       // Content editor
      ADMIN,        // Administrator
      SUPER_USER    // Super administrator
  }
  ```
- ✅ Added bidirectional @OneToOne relationships to Player, Coach, Scouter entities

### 5. Repository Updates

**File**: [UserRepository.java](src/main/java/com/elevenof/backoffice/repository/UserRepository.java)

**Changes**:
- Renamed `findByUsername(String username)` → `findByPhone(String phone)`
- Renamed `existsByUsername(String username)` → `existsByPhone(String phone)`

### 6. Service Updates

#### AuthenticationService
**File**: [AuthenticationService.java](src/main/java/com/elevenof/backoffice/service/AuthenticationService.java)

**Changes**:
- Updated all method calls to use `phone` instead of `username`
- Log messages now reference "phone" instead of "username"

#### CustomUserDetailsService
**File**: [CustomUserDetailsService.java](src/main/java/com/elevenof/backoffice/service/CustomUserDetailsService.java)

**Changes**:
- `loadUserByUsername(String phone)` now uses `findByPhone(phone)`
- UserDetails object uses `user.getPhone()` as the principal

### 7. Configuration Updates

#### DatabaseInitializer
**File**: [DatabaseInitializer.java](src/main/java/com/elevenof/backoffice/config/DatabaseInitializer.java)

**Changes**:
- Admin user creation now uses `.phone("admin")` instead of `.username("admin")`
- Check uses `existsByPhone("admin")` instead of `existsByUsername("admin")`
- Removed `.isPlayer(false)` from builder

### 8. Template Updates

#### Login Page
**File**: [login.html](src/main/resources/templates/admin/login.html)

**Changes**:
- Updated hint text: "Số điện thoại: admin" (instead of "Username: admin")
- Updated placeholder: "Số điện thoại hoặc tên tài khoản"
- Input name remains `username` for Spring Security compatibility

### 9. Database Migration

**File**: [V2__refactor_user_and_add_role_tables.sql](src/main/resources/db/migration/V2__refactor_user_and_add_role_tables.sql)

**Migration Steps**:
1. ✅ Created `players`, `coaches`, `scouters` tables with foreign keys to `users(id)`
2. ✅ Added temporary `phone` column to users table
3. ✅ Copied data from `username` to `phone`
4. ✅ Made `phone` column NOT NULL and UNIQUE
5. ✅ Migrated existing player data to `players` table
6. ✅ Updated role enum from ENUM to VARCHAR(20)
7. ✅ Updated user role to 'PLAYER' for migrated players
8. ✅ Dropped old `username` column
9. ✅ Dropped old player-specific columns: `is_player`, `positions`, `height`, `weight`, `preferred_foot`

**Migration Results**:
- ✅ Migration completed successfully
- ✅ All tables created with proper foreign key constraints
- ✅ Data migrated without loss
- ✅ Admin user preserved with phone="admin"

### 10. Authentication Verification

**Testing Results**:
- ✅ Application starts successfully
- ✅ Admin user created automatically with phone="admin", password="123456"
- ✅ Login works correctly with phone="admin"
- ✅ Dashboard loads after successful authentication
- ✅ Session management working properly

---

## ✅ Frontend Changes (Next.js)

### 1. Registration Page Updated

**File**: [page.tsx](frontend-app/src/app/auth/register/page.tsx)

**Changes**:

#### Form State Update
```typescript
// OLD:
isPlayer: registerConfig.playerToggleDefaultState,

// NEW:
role: registerConfig.playerToggleDefaultState ? 'PLAYER' : 'USER',
```

#### Toggle Control Update
```typescript
// OLD:
<Toggle
  enabled={formData.isPlayer}
  onChange={(enabled) => setFormData({ ...formData, isPlayer: enabled })}
/>

// NEW:
<Toggle
  enabled={formData.role === 'PLAYER'}
  onChange={(enabled) => setFormData({ ...formData, role: enabled ? 'PLAYER' : 'USER' })}
/>
```

#### Conditional Section Rendering
```typescript
// OLD:
{formData.isPlayer && (
  <div>Player fields...</div>
)}

// NEW:
{formData.role === 'PLAYER' && (
  <div>Player fields...</div>
)}
```

#### Submit Data Structure
```typescript
// OLD:
{
  fullName, phone, password,
  isPlayer: formData.isPlayer,
  positions, height, weight, preferredFoot
}

// NEW:
{
  fullName, phone, password,
  role: formData.role,
  playerProfile: {
    positions, height, weight, preferredFoot
  }
}
```

### 2. Type Definitions Updated

**File**: [auth.ts](frontend-app/src/types/auth.ts)

**Changes**:

#### User Interface
```typescript
// OLD:
interface User {
  username: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_USER';
}

// NEW:
interface User {
  phone: string;
  email?: string;
  role: 'USER' | 'PLAYER' | 'COACH' | 'SCOUTER' | 'EDITOR' | 'ADMIN' | 'SUPER_USER';
}
```

#### LoginCredentials Interface
```typescript
// OLD:
interface LoginCredentials {
  email: string;
  password: string;
}

// NEW:
interface LoginCredentials {
  phone: string;
  password: string;
}
```

#### RegisterData Interface
```typescript
// OLD:
interface RegisterData {
  fullName: string;
  phone: string;
  password: string;
  isPlayer?: boolean;
  positions?: string[];
  height?: string;
  weight?: string;
  preferredFoot?: string;
  email?: string;
}

// NEW:
interface RegisterData {
  fullName: string;
  phone: string;
  password: string;
  role: 'USER' | 'PLAYER' | 'COACH' | 'SCOUTER';
  email?: string;
  playerProfile?: {
    positions?: string[];
    height?: string;
    weight?: string;
    preferredFoot?: string;
  };
}
```

---

## 🔑 Key Architectural Improvements

### 1. Separation of Concerns
- **User table**: Only authentication and basic profile data
- **Role-specific tables**: Contains data specific to each role type
- Clear separation makes the schema more maintainable and scalable

### 2. Flexible Role System
- Easy to add new roles (e.g., REFEREE, MANAGER)
- Each role can have its own profile table with specific fields
- Role determines which profile table to query

### 3. Phone-Based Authentication
- `phone` field properly named (was incorrectly named `username`)
- Supports both phone numbers (0987654321) and special strings (admin)
- Better semantic clarity in code

### 4. @MapsId Pattern
- Player/Coach/Scouter share the same ID as User
- One-to-one relationship enforced at database level
- Efficient joins and referential integrity

### 5. Type Safety
- Frontend TypeScript types match backend models
- Role-based data structure prevents runtime errors
- Clear contract between frontend and backend

---

## 🎯 Usage Examples

### Backend: Create a Player User

```java
// Step 1: Create User with PLAYER role
User user = User.builder()
    .phone("0987654321")
    .fullName("Nguyễn Văn A")
    .email("player@example.com")
    .password("password123")
    .role(User.Role.PLAYER)
    .enabled(true)
    .build();

User savedUser = authenticationService.createUser(user);

// Step 2: Create Player Profile
Player player = Player.builder()
    .user(savedUser)
    .positions("striker,midfielder")
    .height(175)
    .weight(70)
    .preferredFoot("right")
    .build();

Player savedPlayer = playerService.createPlayerProfile(savedUser.getId(), player);
```

### Frontend: Registration Flow

```typescript
// User toggles "Bạn là tuyển thủ" ON
// formData.role = 'PLAYER'

// Submit registration
const data = {
  fullName: "Nguyễn Văn A",
  phone: "0987654321",
  password: "password123",
  role: "PLAYER",
  playerProfile: {
    positions: ["striker", "midfielder"],
    height: "175",
    weight: "70",
    preferredFoot: "right"
  }
};

await register(data);
```

---

## 📊 Database Schema

### Before Refactoring
```
users
├── id
├── username (phone number)
├── full_name
├── email
├── password
├── role (USER, ADMIN, SUPER_USER)
├── is_player
├── positions
├── height
├── weight
└── preferred_foot
```

### After Refactoring
```
users                          players
├── id                        ├── id (FK → users.id)
├── phone                     ├── positions
├── full_name                 ├── height
├── email                     ├── weight
├── password                  └── preferred_foot
└── role (USER, PLAYER,
    COACH, SCOUTER, EDITOR,   coaches
    ADMIN, SUPER_USER)        ├── id (FK → users.id)
                              ├── specialization
                              ├── years_of_experience
                              └── certifications

                              scouters
                              ├── id (FK → users.id)
                              ├── territory
                              ├── specialization
                              └── years_of_experience
```

---

## ✅ Verification Checklist

### Backend
- [x] All new entities created (Player, Coach, Scouter)
- [x] All repositories created
- [x] All services created with role validation
- [x] User entity updated (phone, removed player fields, expanded Role enum)
- [x] UserRepository methods renamed
- [x] AuthenticationService updated
- [x] CustomUserDetailsService updated
- [x] DatabaseInitializer updated
- [x] Login template updated
- [x] Database migration executed successfully
- [x] Authentication tested and working

### Frontend
- [x] Registration page updated to use role instead of isPlayer
- [x] Toggle controls role (PLAYER vs USER)
- [x] Player section shows when role === 'PLAYER'
- [x] Submit sends role and playerProfile structure
- [x] User interface updated with new roles
- [x] LoginCredentials updated to use phone
- [x] RegisterData interface updated with role and playerProfile

### Database
- [x] players table created
- [x] coaches table created
- [x] scouters table created
- [x] phone column created in users
- [x] username column dropped from users
- [x] Player fields dropped from users
- [x] Foreign key constraints in place
- [x] Data migrated successfully

---

## 🚀 Next Steps (Optional Enhancements)

1. **Backend API Endpoints**:
   - Create REST endpoints for player/coach/scouter profile management
   - Add DTOs for registration with role-specific data
   - Implement profile update endpoints

2. **Frontend Updates**:
   - Add profile pages for players/coaches/scouters
   - Implement profile editing
   - Add role-based dashboard views

3. **Admin UI**:
   - Add user management pages in admin panel
   - Display role-specific information in user list
   - Allow admins to create users with any role

4. **Validation**:
   - Add @Pattern validation for phone numbers
   - Add @Min/@Max validation for height/weight
   - Validate position options

5. **Documentation**:
   - Update API documentation with new endpoints
   - Document role-based access control
   - Add examples for each role type

---

## 📚 Documentation Files

- **QUICK_START.md**: Basic getting started guide (needs update for phone field)
- **ADMIN_AUTHENTICATION.md**: Detailed authentication documentation (needs update)
- **This file**: Complete refactoring summary

---

## 🎉 Summary

The database refactoring is **complete and fully functional**:

- ✅ **Backend**: All Java code updated, database migrated, authentication working
- ✅ **Frontend**: Registration page updated to use role-based logic
- ✅ **Type Safety**: TypeScript types match backend models
- ✅ **Tested**: Authentication verified with admin login

The system now has a clean separation of concerns with role-specific data in dedicated tables, making it easy to add new roles and scale the application.
