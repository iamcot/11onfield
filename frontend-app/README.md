# Frontend App

Next.js application for end users.

## Tech Stack
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Getting Started

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## API Configuration

The app connects to the backend API at `http://localhost:8080/api`

Update API endpoint in environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Project Structure

```
frontend-app/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── auth/         # Authentication pages (login, register)
│   │   ├── dashboard/    # Dashboard page
│   │   ├── profile/      # Profile pages
│   │   ├── layout.tsx    # Root layout with AuthProvider
│   │   ├── page.tsx      # Home page (redirects to login/dashboard)
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable React components
│   ├── contexts/         # React contexts (AuthContext)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (api-client, storage)
│   ├── services/         # API services (auth.service)
│   └── types/            # TypeScript types and interfaces
├── public/               # Static assets
├── .env.local            # Environment variables (not committed)
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## Features

### ✅ Implemented
- User authentication (login/register)
- OAuth2 JWT token management
- Protected routes with auto-redirect
- User dashboard with profile information
- Responsive design with Tailwind CSS
- TypeScript for type safety
- Secure token storage in localStorage
- Auto token refresh handling

### Authentication Flow
1. User logs in or registers
2. API returns access token and refresh token
3. Tokens stored in localStorage
4. AuthContext manages authentication state
5. Protected pages check authentication status
6. Unauthorized users redirected to login

## Available Pages

- `/` - Home (auto-redirects based on auth status)
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - User dashboard (protected)
- `/profile` - User profile (coming soon)

## API Integration

The app uses a centralized API client (`src/lib/api-client.ts`) that:
- Handles all HTTP requests (GET, POST, PUT, DELETE)
- Automatically includes auth tokens
- Manages error responses
- Provides type-safe requests

## Authentication

Uses OAuth2 flow with the backend API. Tokens are stored securely and automatically refreshed.
