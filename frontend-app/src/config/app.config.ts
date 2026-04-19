// Main application configuration
export const appConfig = {
  // Enable mock data in development (bypasses API calls)
  // Set to true to use mock data for login and user operations
  // Set to false to use real API calls
  useMockData: false, // Changed to false to use real backend API

  // API configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',

  // Only allow mock data in development mode
  get isMockEnabled() {
    return process.env.NODE_ENV === 'development' && this.useMockData;
  },
};
