'use client';

import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { User, LoginCredentials, RegisterData } from '@/types';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { SESSION_EXPIRED_EVENT } from '@/lib/api-client';
import { storage } from '@/lib/storage';

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
  // false while the stored session is being checked on load: a stale token found then just signs out quietly
  const ready = useRef(false);

  useEffect(() => {
    // A signed-in call was refused (token expired): sign out here too, and send the player to log in again,
    // then back to the page they were on.
    const onExpired = () => {
      setUser(null);
      setShouldCheckProfileCompletion(false);
      const here = window.location.pathname + window.location.search;
      if (ready.current && !window.location.pathname.startsWith('/auth/')) {
        window.location.assign(`/auth/login?redirect=${encodeURIComponent(here)}`);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    // Check if user is authenticated on mount
    const initAuth = async () => {
      try {
        // a token past its expiry is a signed-out visitor: do not show the stored user and fail on the first save
        if (authService.isAuthenticated() && storage.isTokenExpired()) storage.clearAuth();
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
            if (!authService.isAuthenticated()) setUser(null); // the server refused the token
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        ready.current = true;
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

  // stable, since pages list it in effect dependencies
  const setProfileCompletionChecked = useCallback(() => {
    setShouldCheckProfileCompletion(false);
  }, []);

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
