import posthog from 'posthog-js';
import { isPosthogBrowserConfigured } from '@/lib/posthog-browser';

if (isPosthogBrowserConfigured()) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
    capture_exceptions: true,
  });
}
