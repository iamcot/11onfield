# Frontend App - Quick Start Guide

## ✅ Setup Complete!

Your Next.js frontend application is fully configured and ready to run.

## What's Included

### Pages
- **Home** (`/`) - Auto-redirects to login or dashboard
- **Login** (`/auth/login`) - User login page
- **Register** (`/auth/register`) - User registration page
- **Dashboard** (`/dashboard`) - Protected user dashboard

### Core Features
- ✅ OAuth2 JWT Authentication
- ✅ Protected Routes
- ✅ Token Storage & Management
- ✅ Auto Token Refresh
- ✅ Type-Safe API Client
- ✅ Auth Context (Global State)
- ✅ Responsive UI (Tailwind CSS)
- ✅ TypeScript Throughout

### Architecture

#### Authentication Flow
```
User → Login Form → API (/auth/login) → JWT Tokens
     → Store in localStorage → AuthContext → Protected Pages
```

#### API Integration
```
Component → useAuth Hook → authService → apiClient → API
```

## Running the App

### Development Mode
```bash
npm run dev
```
App will be available at: http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

## Environment Variables

Already configured in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/
│   │   ├── login/         # Login page
│   │   └── register/      # Register page
│   ├── dashboard/         # Dashboard page
│   ├── layout.tsx         # Root layout (includes AuthProvider)
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── ProtectedRoute.tsx # Route protection wrapper
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state management
├── hooks/                 # Custom React hooks
│   └── useApi.ts          # API call hook
├── lib/                   # Utilities
│   ├── api-client.ts      # Centralized API client
│   └── storage.ts         # localStorage wrapper
├── services/              # API services
│   └── auth.service.ts    # Authentication service
└── types/                 # TypeScript types
    ├── auth.ts            # Auth types
    ├── api.ts             # API types
    └── index.ts           # Type exports
```

## Using the API Client

### In Components
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();

  // Use auth methods...
}
```

### Custom API Calls
```typescript
import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';

const token = storage.getToken();

const data = await apiClient.get('/endpoint', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### Using useApi Hook
```typescript
import { useApi } from '@/hooks';
import { apiClient } from '@/lib/api-client';

const { data, error, isLoading, execute } = useApi(
  () => apiClient.get('/some-endpoint')
);

// Call when needed
await execute();
```

## Next Steps

1. **Start the backend API** first:
   ```bash
   cd ../api
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Test the flow**:
   - Visit http://localhost:3000
   - Create an account at /auth/register
   - Login at /auth/login
   - View dashboard at /dashboard

## Adding New Features

### Add a New Page
1. Create folder in `src/app/`
2. Add `page.tsx` file
3. Use `ProtectedRoute` if needed

### Add a New API Service
1. Create file in `src/services/`
2. Use `apiClient` for requests
3. Define types in `src/types/`

### Add a New Component
1. Create file in `src/components/`
2. Export from `src/components/index.ts`
3. Import using `@/components`

## Troubleshooting

### API Connection Issues
- Check API is running on port 8080
- Verify `.env.local` has correct API URL
- Check browser console for CORS errors

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Type Errors
```bash
npx tsc --noEmit
```

## Security Notes

- Tokens stored in localStorage (client-side)
- HTTPS recommended for production
- Implement token refresh before expiry
- Clear tokens on logout
- Never commit `.env.local` to git
