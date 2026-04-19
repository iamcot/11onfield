import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';
import { appConfig } from '@/config/app.config';
import { mockLogin, mockRegister, mockGetCurrentUser } from '@/mocks/user.mock';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Use mock data if enabled in development
    if (appConfig.isMockEnabled) {
      console.log('[MOCK MODE] Using mock login data');
      const response = mockLogin(credentials.phone, credentials.password);

      // Store tokens and user data
      storage.setToken(response.tokens.accessToken);
      storage.setRefreshToken(response.tokens.refreshToken);
      storage.setUser(response.user);

      return response;
    }

    // Real API call
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    // Store tokens and user data
    storage.setToken(response.tokens.accessToken);
    storage.setRefreshToken(response.tokens.refreshToken);
    storage.setUser(response.user);

    return response;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    // Use mock data if enabled in development
    if (appConfig.isMockEnabled) {
      console.log('[MOCK MODE] Using mock register data');
      const response = mockRegister(data);

      // Store tokens and user data
      storage.setToken(response.tokens.accessToken);
      storage.setRefreshToken(response.tokens.refreshToken);
      storage.setUser(response.user);

      return response;
    }

    // Real API call
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // Store tokens and user data
    storage.setToken(response.tokens.accessToken);
    storage.setRefreshToken(response.tokens.refreshToken);
    storage.setUser(response.user);

    return response;
  },

  async logout(): Promise<void> {
    // Use mock data if enabled in development
    if (appConfig.isMockEnabled) {
      console.log('[MOCK MODE] Mock logout');
      storage.clearAuth();
      return;
    }

    // Clear auth data (no backend logout endpoint needed for JWT)
    storage.clearAuth();
  },

  async getCurrentUser(): Promise<User> {
    // Use mock data if enabled in development
    if (appConfig.isMockEnabled) {
      console.log('[MOCK MODE] Using mock current user');
      return mockGetCurrentUser();
    }

    // Real API call
    const token = storage.getToken();

    if (!token) {
      throw new Error('No access token available');
    }

    return apiClient.get<User>('/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  isAuthenticated(): boolean {
    return !!storage.getToken();
  },

  getStoredUser(): User | null {
    return storage.getUser();
  },
};
