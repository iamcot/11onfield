'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * PageViewTracker component
 * Automatically tracks page views when the URL changes in Next.js App Router
 *
 * Must be rendered inside AnalyticsProvider
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { page, isInitialized } = useAnalytics();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;

    // Build full URL with search params
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Skip if it's the same page (prevents duplicate tracking on re-renders)
    if (previousPathname.current === url) return;

    previousPathname.current = url;

    // Track page view
    page({
      $current_url: url,
      $pathname: pathname,
      $search_params: searchParams?.toString() || '',
      $referrer: document.referrer || undefined,
      $title: document.title,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page view tracked:', url);
    }
  }, [pathname, searchParams, page, isInitialized]);

  return null; // This component doesn't render anything
}
