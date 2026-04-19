# Mock Data Configuration

This project supports mock data mode for development, allowing you to work without a backend API.

## Configuration

Mock mode is controlled in `/src/config/app.config.ts`:

```typescript
export const appConfig = {
  // Toggle mock data mode
  useMockData: true, // Set to false to use real API
};
```

## Enabling/Disabling Mock Mode

### Enable Mock Mode (Default)
```typescript
// In /src/config/app.config.ts
useMockData: true
```

### Disable Mock Mode (Use Real API)
```typescript
// In /src/config/app.config.ts
useMockData: false
```

**Note**: Mock mode only works in development (`NODE_ENV=development`). In production, real API is always used.

## Mock Users

Located in `/src/mocks/user.mock.ts`, you have access to these test accounts:

### 1. Player Account
- **Phone**: `0123456789`
- **Password**: Any (mock mode accepts any password)
- **Role**: USER
- **Type**: Player with positions and stats
- **Name**: Nguyễn Văn A

### 2. Admin Account
- **Phone**: `0987654321`
- **Password**: Any
- **Role**: ADMIN
- **Type**: Non-player
- **Name**: Trần Thị B

### 3. Regular User Account
- **Phone**: `0111111111`
- **Password**: Any
- **Role**: USER
- **Type**: Non-player
- **Name**: Lê Văn C

## Features Supported in Mock Mode

When mock mode is enabled:

- ✅ **Login**: Use any mock user phone number with any password
- ✅ **Register**: Creates new mock users (stored in memory, lost on refresh)
- ✅ **Get Current User**: Returns mock user data
- ✅ **Logout**: Clears local storage
- ✅ **Token Refresh**: Generates mock tokens

## Console Logging

When mock mode is active, you'll see console logs:
```
[MOCK MODE] Using mock login data
[MOCK MODE] Using mock register data
[MOCK MODE] Using mock current user
```

## Adding More Mock Users

Edit `/src/mocks/user.mock.ts` and add to the `mockUsers` array:

```typescript
export const mockUsers = [
  // Existing users...
  {
    id: '4',
    phone: '0222222222',
    fullName: 'Your Name',
    role: 'USER',
    isPlayer: true,
    positions: ['goalkeeper'],
    // ... other fields
  },
];
```

## Testing Workflow

1. **Development with Mock Data**:
   - Set `useMockData: true`
   - No backend required
   - Quick UI testing and development

2. **Testing API Integration**:
   - Set `useMockData: false`
   - Ensure backend is running
   - Test real API calls

3. **Production**:
   - Mock mode automatically disabled
   - Always uses real API calls

## Files Involved

- `/src/config/app.config.ts` - Main configuration
- `/src/mocks/user.mock.ts` - Mock user data and functions
- `/src/services/auth.service.ts` - Auth service with mock support
