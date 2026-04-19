# Thymeleaf 3.1+ Compatibility Fix

## Issue
When accessing `/admin/dashboard`, the application threw this error:
```
java.lang.IllegalArgumentException: The 'request','session','servletContext' and 'response'
expression utility objects are no longer available by default for template expressions
```

## Root Cause
Thymeleaf 3.1+ (used in Spring Boot 3.x) removed direct access to:
- `${#request}`
- `${#session}`
- `${#servletContext}`
- `${#response}`

These were used in the layout template for:
1. Getting authenticated username
2. Checking request URI for active menu highlighting

## Fixes Applied

### 1. Spring Security Integration (Line 2, 35)
**Before:**
```html
<html xmlns:th="http://www.thymeleaf.org">
...
<span th:text="${#authentication.principal.username}">Admin</span>
```

**After:**
```html
<html xmlns:th="http://www.thymeleaf.org"
      xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
...
<span sec:authentication="principal.username">Admin</span>
```

### 2. Active Menu Highlighting (Lines 70, 80, 90, 100, 110)
**Before:**
```html
<a th:classappend="${#strings.contains(#request.requestURI, '/admin/dashboard') ? 'active' : ''}">
```

**After:**
```html
<a th:classappend="${title == 'Tổng quan' ? 'active' : ''}">
```

## Why This Works

### Spring Security Namespace
- Uses `thymeleaf-extras-springsecurity6` dependency (already in pom.xml)
- Provides `sec:authentication` attribute for accessing security context
- Compatible with Spring Boot 3.x

### Title-Based Active State
- Each controller already passes `title` to the model
- Simpler and more maintainable than URI checking
- No dependency on request objects

## Files Modified
- `/src/main/resources/templates/fragments/layout.html`

## Verification
Run this command to verify no deprecated expressions remain:
```bash
grep -r "#request\|#session\|#servletContext\|#response" src/main/resources/templates/
```

Should return: `No issues found`

## Result
✅ Admin dashboard now loads successfully
✅ Authentication works properly
✅ Active menu items highlight correctly
✅ No deprecated Thymeleaf expressions

## Reference
- [Thymeleaf 3.1 Migration Guide](https://www.thymeleaf.org/doc/articles/thymeleaf31whatsnew.html)
- [Spring Security Thymeleaf Integration](https://docs.spring.io/spring-security/reference/servlet/integrations/mvc.html#mvc-thymeleaf)
