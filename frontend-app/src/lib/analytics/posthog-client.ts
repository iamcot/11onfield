import posthog from 'posthog-js';

let posthogInstance: typeof posthog | null = null;

/**
 * Initialize PostHog analytics client
 * Should be called once on app initialization
 */
export function initPostHog() {
  // Only run in browser
  if (typeof window === 'undefined') return null;

  // Return existing instance if already initialized
  if (posthogInstance) return posthogInstance;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('PostHog API key not found. Analytics tracking is disabled.');
    return null;
  }

  posthog.init(apiKey, {
    api_host: host,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug(); // Enable debug mode in development
      }
    },
    capture_pageview: false, // We'll handle page views manually
    capture_pageleave: true, // Track when users leave pages
    autocapture: false, // Manual tracking only for full control
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true, // Mask all input fields by default
      maskTextSelector: '[data-private]', // Mask elements with data-private attribute
    },
    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: false,
    secure_cookie: true,
  });

  posthogInstance = posthog;
  return posthog;
}

/**
 * Get the PostHog instance
 * Returns null if not initialized
 */
export function getPostHog() {
  return posthogInstance;
}
