# Quick Start - Admin Authentication

## ✅ Authentication System Ready!

I've created a complete admin authentication system with automatic database initialization.

## 🚀 Start the Application

```bash
cd backoffice
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## 🔐 Login Credentials

When the application starts, it will automatically create an admin user:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `123456` |

## 📝 Access the Admin Panel

1. **Open your browser:** http://localhost:8080/admin/dashboard
2. **You'll be redirected to:** http://localhost:8080/admin/login
3. **Enter credentials:**
   - Username: `admin`
   - Password: `123456`
4. **Click "Đăng nhập"**
5. **Success!** You'll see the dashboard

## 📋 What Was Created

### Backend Components:
✅ **User Entity** - Database model with player fields
✅ **UserRepository** - JPA repository for database access
✅ **CustomUserDetailsService** - Spring Security integration
✅ **AuthenticationService** - User management service
✅ **PasswordEncoder** - BCrypt password hashing
✅ **DatabaseInitializer** - Auto-creates admin user on startup
✅ **SecurityConfig** - Updated with form login & session management
✅ **LoginController** - Handles login page

### Frontend Updates:
✅ **Login Page** - Shows default credentials
✅ **Logout Button** - Proper POST form for logout
✅ **Error Messages** - Vietnamese error messages

## 🗄️ Database

The system will automatically create a `users` table with these fields:
- `id` - Auto-increment primary key
- `username` - Phone number (unique)
- `full_name` - User's full name
- `email` - Email address
- `password` - BCrypt hashed password
- `role` - USER, ADMIN, or SUPER_USER
- `enabled` - Account status
- Player-specific fields (height, weight, positions, etc.)
- Timestamps (created_at, updated_at)

## 🎯 Features

### Security Features:
- ✅ BCrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ Session-based authentication
- ✅ Remember me functionality
- ✅ Secure logout
- ✅ Account locking capability

### User Roles:
- **USER** - Regular users (no admin access)
- **ADMIN** - Administrators (full admin panel access)
- **SUPER_USER** - Super administrators (elevated privileges)

## 🔧 Configuration

### Routes:
- **Admin Panel:** `/admin/**` → Requires ADMIN or SUPER_USER role
- **Login Page:** `/admin/login` → Public access
- **REST API:** `/api/**` → Uses JWT authentication (separate)

### Session:
- Maximum 1 session per user
- Session stored in JSESSIONID cookie
- Invalidated on logout

## 📖 Full Documentation

For detailed information, see:
- [ADMIN_AUTHENTICATION.md](ADMIN_AUTHENTICATION.md) - Complete implementation guide
- [ADMIN_UI_SETUP.md](ADMIN_UI_SETUP.md) - AdminLTE setup guide

## 🐛 Troubleshooting

### Can't login?
1. Check console logs for "Default admin user created" message
2. Verify database connection
3. Clear browser cookies and try again

### User already exists?
The admin user is only created once. If it already exists, you'll see:
```
Admin user already exists, skipping initialization
```

### Database connection error?
Check `application.yml` database settings:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/elevenof_db_dev
    username: root
    password: your_password
```

## 🎉 You're All Set!

The authentication system is fully functional and ready to use!

**Next Steps:**
1. Start the application
2. Login with admin/123456
3. Explore the admin panel
4. Add more users if needed

---

**Default Credentials:**
- Username: `admin`
- Password: `123456`

**Admin Panel:** http://localhost:8080/admin
