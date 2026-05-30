import { useAnalytics as useAnalyticsContext } from '@/contexts/AnalyticsContext';

/**
 * Custom hook for analytics tracking
 * Re-exports the hook from AnalyticsContext for convenience
 *
 * Usage:
 * ```tsx
 * const { track, identify } = useAnalytics();
 * track('user_login', { method: 'phone_password' });
 * ```
 */
export const useAnalytics = useAnalyticsContext;
