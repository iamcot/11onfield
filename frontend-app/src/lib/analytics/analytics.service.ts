import { getPostHog } from './posthog-client';
import { AnalyticsEvent, UserProperties } from '@/types/analytics';

/**
 * Analytics service for tracking user events
 * Provides a high-level API for tracking, identifying users, and page views
 */
class AnalyticsService {
  private get client() {
    return getPostHog();
  }

  /**
   * Track a custom event
   * @param event Event name from AnalyticsEvent type
   * @param properties Event-specific properties
   */
  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    if (!this.client) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] track:', event, properties);
      }
      return;
    }

    try {
      this.client.capture(event, {
        ...properties,
        $timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Analytics] Track error:', error);
    }
  }

  /**
   * Identify a user with their properties
   * @param userId Unique user identifier
   * @param properties User properties
   */
  identify(userId: string, properties?: UserProperties) {
    if (!this.client) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] identify:', userId, properties);
      }
      return;
    }

    try {
      this.client.identify(userId, properties);
    } catch (error) {
      console.error('[Analytics] Identify error:', error);
    }
  }

  /**
   * Track a page view
   * @param properties Page-specific properties (url, title, referrer, etc.)
   */
  page(properties?: Record<string, any>) {
    if (!this.client) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] pageview:', properties);
      }
      return;
    }

    try {
      this.client.capture('$pageview', properties);
    } catch (error) {
      console.error('[Analytics] Page view error:', error);
    }
  }

  /**
   * Reset the analytics session
   * Call this on logout to clear user identification
   */
  reset() {
    if (!this.client) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] reset');
      }
      return;
    }

    try {
      this.client.reset();
    } catch (error) {
      console.error('[Analytics] Reset error:', error);
    }
  }

  /**
   * Set user properties without identifying
   * Useful for updating user properties after identification
   * @param properties User properties to set
   */
  setUserProperties(properties: UserProperties) {
    if (!this.client) return;

    try {
      this.client.people.set(properties);
    } catch (error) {
      console.error('[Analytics] Set user properties error:', error);
    }
  }

  /**
   * Check if analytics is initialized
   */
  isInitialized(): boolean {
    return this.client !== null;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
