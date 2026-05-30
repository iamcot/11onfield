'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initPostHog } from '@/lib/analytics/posthog-client';
import { analytics } from '@/lib/analytics/analytics.service';
import { AnalyticsEvent, UserProperties } from '@/types/analytics';
import { useAuth } from './AuthContext';

interface AnalyticsContextType {
  isInitialized: boolean;
  track: (event: AnalyticsEvent, properties?: Record<string, any>) => void;
  identify: (userId: string, properties?: UserProperties) => void;
  page: (properties?: Record<string, any>) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize PostHog on mount
  useEffect(() => {
    const ph = initPostHog();
    if (ph) {
      setIsInitialized(true);
      console.log('[Analytics] PostHog initialized successfully');
    }
  }, []);

  // Identify user when authenticated
  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated && user) {
      // Identify user with their properties
      // Convert user.id to string to ensure PostHog compatibility
      analytics.identify(String(user.id), {
        userId: String(user.id),
        phone: user.phone,
        userid: user.userid,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        hasAvatar: !!user.avatar,
        hasEmail: !!user.email,
      });

      console.log('[Analytics] User identified:', user.id);
    }
  }, [isInitialized, isAuthenticated, user]);

  // Reset analytics on logout
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !user) {
      analytics.reset();
      console.log('[Analytics] Session reset');
    }
  }, [isInitialized, isAuthenticated, user]);

  const value: AnalyticsContextType = {
    isInitialized,
    track: analytics.track.bind(analytics),
    identify: analytics.identify.bind(analytics),
    page: analytics.page.bind(analytics),
    reset: analytics.reset.bind(analytics),
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}
