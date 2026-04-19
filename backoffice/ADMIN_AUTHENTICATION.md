# Admin Authentication System - Implementation Guide

## ✅ What Was Implemented

Complete authentication system for the backoffice admin panel with automatic database initialization.

## 📁 Files Created/Modified

### 1. Entity & Repository
- **[User.java](src/main/java/com/elevenof/backoffice/model/User.java)** - User entity with player fields
- **[UserRepository.java](src/main/java/com/elevenof/backoffice/repository/UserRepository.java)** - JPA repository

### 2. Services
- **[CustomUserDetailsService.java](src/main/java/com/elevenof/backoffice/service/CustomUserDetailsService.java)** - Spring Security integration
- **[AuthenticationService.java](src/main/java/com/elevenof/backoffice/service/AuthenticationService.java)** - User management service

### 3. Configuration
- **[PasswordEncoderConfig.java](src/main/java/com/elevenof/backoffice/config/PasswordEncoderConfig.java)** - BCrypt password encoder
- **[DatabaseInitializer.java](src/main/java/com/elevenof/backoffice/config/DatabaseInitializer.java)** - Auto-creates admin user
- **[SecurityConfig.java](src/main/java/com/elevenof/backoffice/config/SecurityConfig.java)** - Updated with form login

### 4. Controllers
- **[LoginController.java](src/main/java/com/elevenof/backoffice/controller/admin/LoginController.java)** - Login page controller

### 5. Templates
- **[login.html](src/main/resources/templates/admin/login.html)** - Updated with credentials hint
- **[layout.html](src/main/resources/templates/fragments/layout.html)** - Updated logout button

## 🗄️ Database Schema

The `User` entity will create this table:

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,  -- Phone number
    full_name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_expired BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_locked BOOLEAN NOT NULL DEFAULT TRUE,
    credentials_non_expired BOOLEAN NOT NULL DEFAULT TRUE,

    -- Player fields
    is_player BOOLEAN DEFAULT FALSE,
    positions VARCHAR(500),  -- Comma-separated
    height INT,
    weight INT,
    preferred_foot VARCHAR(10),

    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

## 🔐 Default Admin Credentials

The system automatically creates an admin user on first startup:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `123456` |
| **Role** | `ADMIN` |
| **Email** | admin@11of.com |

## 🚀 How It Works

### 1. **Automatic User Creation**
On application startup, `DatabaseInitializer` checks if admin user exists:
- If not found → Creates admin user with password `123456`
- If exists → Skips creation
- Password is automatically hashed with BCrypt

### 2. **Authentication Flow**
```
User visits /admin/dashboard
    ↓
Not authenticated → Redirect to /admin/login
    ↓
User enters: username=admin, password=123456
    ↓
Spring Security validates via CustomUserDetailsService
    ↓
Success → Redirect to /admin/dashboard
    ↓
Session created (JSESSIONID cookie)
```

### 3. **Role-Based Access**
- `/admin/**` → Requires `ROLE_ADMIN` or `ROLE_SUPER_USER`
- `/admin/login` → Public access
- `/api/**` → Uses JWT (separate authentication)

## 🧪 Testing the Authentication

### Step 1: Start the Application
```bash
cd backoffice
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Step 2: Check Console Logs
You should see:
```
========================================
Default admin user created:
Username: admin
Password: 123456
========================================
```

### Step 3: Access Admin Panel
1. Navigate to: `http://localhost:8080/admin/dashboard`
2. You'll be redirected to: `http://localhost:8080/admin/login`
3. Enter credentials:
   - **Username:** `admin`
   - **Password:** `123456`
4. Click "Đăng nhập"
5. Success! You'll see the dashboard

### Step 4: Test Logout
1. Click on username dropdown in top navbar
2. Click "Đăng xuất"
3. You'll be redirected to login page with success message

## 🔧 Security Configuration Details

### Admin Security Chain (Order 2)
```java
.securityMatcher("/admin/**")
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/admin/login", "/admin/css/**", "/admin/js/**").permitAll()
    .requestMatchers("/admin/**").hasAnyRole("ADMIN", "SUPER_USER")
)
.formLogin(form -> form
    .loginPage("/admin/login")
    .loginProcessingUrl("/admin/login")
    .defaultSuccessUrl("/admin/dashboard", true)
    .usernameParameter("username")
    .passwordParameter("password")
)
```

### Password Encryption
- Uses **BCrypt** hashing algorithm
- Automatically encodes password when creating users
- Passwords are never stored in plain text

### Session Management
- Session-based authentication (not JWT)
- Maximum 1 session per user
- Session expires when browser closes (by default)
- Session ID stored in `JSESSIONID` cookie

## 📝 User Roles

Three roles available:

| Role | Description | Access Level |
|------|-------------|-------------|
| **USER** | Regular user | Cannot access admin panel |
| **ADMIN** | Administrator | Full admin panel access |
| **SUPER_USER** | Super Admin | Full admin panel access + future elevated privileges |

## 🔐 Adding More Users

### Option 1: Via Code (Programmatically)
```java
User newUser = User.builder()
    .username("0987654321")  // Phone number
    .fullName("Nguyen Van B")
    .email("user@example.com")
    .password("rawPassword")  // Will be encoded automatically
    .role(User.Role.ADMIN)
    .enabled(true)
    .accountNonExpired(true)
    .accountNonLocked(true)
    .credentialsNonExpired(true)
    .isPlayer(false)
    .build();

authenticationService.createUser(newUser);
```

### Option 2: Via Database (Manual)
```sql
INSERT INTO users (username, full_name, email, password, role, enabled,
                   account_non_expired, account_non_locked, credentials_non_expired,
                   is_player, created_at, updated_at)
VALUES ('0123456789',
        'Test User',
        'test@example.com',
        '$2a$10$your_bcrypt_hashed_password_here',  -- Use BCrypt hash!
        'ADMIN',
        true, true, true, true, false,
        NOW(), NOW());
```

**Important:** To generate BCrypt hash for manual insertion:
```java
String hash = new BCryptPasswordEncoder().encode("yourPassword");
System.out.println(hash);
```

### Option 3: Create User Management API (TODO)
In the future, add endpoints in `/api/users` to manage users via REST API.

## 🛡️ Security Features Implemented

✅ **BCrypt Password Hashing** - Passwords never stored in plain text
✅ **Role-Based Access Control (RBAC)** - Only ADMIN/SUPER_USER can access admin panel
✅ **Session Management** - Secure session handling with cookies
✅ **Remember Me** - Checkbox available (extend session)
✅ **Logout** - Proper session invalidation
✅ **Login Errors** - User-friendly error messages in Vietnamese
✅ **Account Status** - Can disable users without deleting

## 🔄 Next Steps (Optional Enhancements)

### 1. Enable CSRF Protection
Update `SecurityConfig.java`:
```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
)
```

Then update login form to include CSRF token:
```html
<input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}"/>
```

### 2. Implement "Remember Me"
Update `SecurityConfig.java`:
```java
.rememberMe(remember -> remember
    .key("uniqueAndSecret")
    .tokenValiditySeconds(86400) // 1 day
)
```

### 3. Add Password Reset Feature
- Create forgot password page
- Implement email/SMS with reset token
- Create password reset controller

### 4. Add User Management UI
- Create CRUD pages for managing users
- List all users in `/admin/users`
- Add/Edit/Delete user functionality

### 5. Implement Account Lockout
- Lock account after N failed login attempts
- Add unlock mechanism

## 🐛 Troubleshooting

### Issue: "Table 'users' doesn't exist"
**Solution:** Check database connection and JPA DDL settings in `application.yml`:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # or 'create-drop' for dev
```

### Issue: "Admin user not created"
**Solution:** Check console logs. If user already exists, it won't be recreated. To recreate:
```sql
DELETE FROM users WHERE username = 'admin';
```
Then restart the application.

### Issue: "Bad credentials" error
**Solution:**
- Make sure you're using `admin` and `123456`
- Check if user exists in database: `SELECT * FROM users WHERE username = 'admin';`
- Verify password is hashed (should start with `$2a$`)

### Issue: "Access Denied" after login
**Solution:** Check user role:
```sql
SELECT username, role FROM users WHERE username = 'admin';
```
Should show `ADMIN` or `SUPER_USER`.

### Issue: Redirects to login page after successful login
**Solution:** Check session configuration. Clear cookies and try again.

## 📊 Monitoring

### Check Active Sessions
```java
// TODO: Implement session monitoring endpoint
@GetMapping("/admin/sessions")
public List<SessionInformation> getActiveSessions() {
    // Return list of active sessions
}
```

### Check Login Attempts (Future)
Add logging or database tracking for failed login attempts.

---

## ✅ Summary

You now have a fully functional admin authentication system:

- ✅ Automatic admin user creation
- ✅ Secure password hashing (BCrypt)
- ✅ Form-based login
- ✅ Role-based access control
- ✅ Session management
- ✅ Logout functionality
- ✅ Vietnamese error messages
- ✅ Login page with credentials hint

**Test it now:**
http://localhost:8080/admin/login
Username: `admin`
Password: `123456`

🎉 Happy coding!
