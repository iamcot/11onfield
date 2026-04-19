# Admin UI Setup Guide

## What Was Created

AdminLTE 3.2 has been integrated into your backoffice Spring Boot application with the following structure:

### 1. Templates (`src/main/resources/templates/`)

#### Layout Fragment
- **`fragments/layout.html`** - Main layout with sidebar navigation
  - Responsive AdminLTE layout
  - Left sidebar with logo and menu items
  - Top navbar with user menu
  - Footer
  - All menu items with Vietnamese labels

#### Admin Pages
- **`admin/dashboard.html`** - Dashboard with statistics cards and recent activity
- **`admin/players.html`** - Players management with table
- **`admin/matches.html`** - Matches management with scores
- **`admin/events.html`** - Events management
- **`admin/users.html`** - Users and ACL management with role information
- **`admin/login.html`** - Admin login page

### 2. Controllers (`src/main/java/com/elevenof/api/controller/admin/`)

- **`AdminController.java`** - Handles all admin page routes
  - `GET /admin/` or `/admin/dashboard` → Dashboard
  - `GET /admin/players` → Players page
  - `GET /admin/matches` → Matches page
  - `GET /admin/events` → Events page
  - `GET /admin/users` → Users & ACL page

### 3. Static Resources (`src/main/resources/static/admin/`)

- **`css/custom.css`** - Custom styling (brand colors, hover effects)
- **`js/custom.js`** - Custom JavaScript (delete confirmations, alerts)

## Navigation Menu Items

The left sidebar includes:
1. **Logo** - "11of Admin"
2. **Tổng quan** (Dashboard) - Overview statistics
3. **Cầu thủ** (Players) - Player management
4. **Trận đấu** (Matches) - Match management
5. **Sự kiện** (Events) - Event management
6. **Tài khoản và phân quyền** (Users & ACL) - User management

## Features Included

✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Vietnamese UI** - All labels and text in Vietnamese
✅ **AdminLTE 3.2** - Modern, clean admin interface
✅ **Mock Data** - Sample data in all tables for testing
✅ **Active Menu State** - Highlights current page in sidebar
✅ **CRUD Actions** - View, Edit, Delete buttons on all tables
✅ **Pagination** - Pagination controls on all list pages
✅ **Statistics Cards** - Dashboard with info boxes
✅ **User Menu** - Profile and logout in top navbar
✅ **Custom Branding** - Blue color scheme matching frontend

## Next Steps

To make this fully functional, you'll need to:

### 1. Configure Spring Security for Admin
Update your `SecurityConfig.java` to:
- Allow `/admin/login` without authentication
- Require ADMIN or SUPER_USER roles for `/admin/**` routes
- Configure session-based authentication for admin
- Configure form login with custom login page

Example:
```java
http
    .securityMatcher("/admin/**")
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/admin/login").permitAll()
        .requestMatchers("/admin/**").hasAnyRole("ADMIN", "SUPER_USER")
    )
    .formLogin(form -> form
        .loginPage("/admin/login")
        .defaultSuccessUrl("/admin/dashboard")
    )
    .logout(logout -> logout
        .logoutUrl("/admin/logout")
        .logoutSuccessUrl("/admin/login?logout")
    );
```

### 2. Add Thymeleaf Dependency (if not already added)
Make sure your `pom.xml` includes:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
<dependency>
    <groupId>org.thymeleaf.extras</groupId>
    <artifactId>thymeleaf-extras-springsecurity6</artifactId>
</dependency>
```

### 3. Connect to Real Data
Update each controller method to:
- Fetch data from services/repositories
- Pass data to model
- Handle form submissions for CRUD operations

### 4. Test the Admin Panel
1. Start your backoffice application
2. Navigate to `http://localhost:8080/admin`
3. You should see the login page (once security is configured)
4. After login, you'll see the dashboard with all navigation working

## CDN Dependencies Used

All CSS and JS are loaded from CDN (no local files needed):
- AdminLTE 3.2 (https://cdn.jsdelivr.net/npm/admin-lte@3.2/)
- Bootstrap 4.6 (included with AdminLTE)
- Font Awesome 6.4 (for icons)
- jQuery 3.6 (required by AdminLTE)

## Customization

### Change Colors
Edit `/admin/css/custom.css`:
- `.brand-link` - Logo background
- `.nav-sidebar .nav-link.active` - Active menu item

### Add New Menu Items
Edit `fragments/layout.html` in the sidebar `<nav>` section

### Add New Pages
1. Create new template in `templates/admin/`
2. Add controller method in `AdminController.java`
3. Add menu item in layout

---

Your admin panel is now ready for development! 🎉
