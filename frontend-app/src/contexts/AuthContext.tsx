'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterData } from '@/types';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  shouldCheckProfileCompletion: boolean;
  setProfileCompletionChecked: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldCheckProfileCompletion, setShouldCheckProfileCompletion] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on mount
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          setUser(storedUser);

          // Optionally refresh user data from server including avatar
          try {
            const currentUser = await authService.getCurrentUser();

            // Fetch full profile to get avatar
            if (currentUser.userid) {
              const userProfile = await userService.getUserByUserid(currentUser.userid);
              // Merge avatar from profile into user
              const userWithAvatar = {
                ...currentUser,
                avatar: userProfile.avatar,
              };
              setUser(userWithAvatar);
            } else {
              setUser(currentUser);
            }
          } catch (error) {
            console.error('Failed to refresh user:', error);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);

      // Fetch full profile to get avatar
      if (response.user.userid) {
        try {
          const userProfile = await userService.getUserByUserid(response.user.userid);
          const userWithAvatar = {
            ...response.user,
            avatar: userProfile.avatar,
          };
          setUser(userWithAvatar);
          setShouldCheckProfileCompletion(true); // Trigger profile check after login
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setUser(response.user);
          setShouldCheckProfileCompletion(true);
        }
      } else {
        setUser(response.user);
        setShouldCheckProfileCompletion(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);

      // Fetch full profile to get avatar
      if (response.user.userid) {
        try {
          const userProfile = await userService.getUserByUserid(response.user.userid);
          const userWithAvatar = {
            ...response.user,
            avatar: userProfile.avatar,
          };
          setUser(userWithAvatar);
          setShouldCheckProfileCompletion(true); // Trigger profile check after registration
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setUser(response.user);
          setShouldCheckProfileCompletion(true);
        }
      } else {
        setUser(response.user);
        setShouldCheckProfileCompletion(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setShouldCheckProfileCompletion(false); // Reset check flag on logout
    } finally {
      setIsLoading(false);
    }
  };

  const setProfileCompletionChecked = () => {
    setShouldCheckProfileCompletion(false);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();

      // Fetch full profile to get avatar
      if (currentUser.userid) {
        const userProfile = await userService.getUserByUserid(currentUser.userid);
        const userWithAvatar = {
          ...currentUser,
          avatar: userProfile.avatar,
        };
        setUser(userWithAvatar);
      } else {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    shouldCheckProfileCompletion,
    setProfileCompletionChecked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
