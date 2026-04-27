/**
 * Client-side PostHog: skip init when env still uses .env.example placeholders
 * or missing host, so dev does not hit /posthog_host/... 404 on localhost.
 */
export function isPosthogBrowserConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? '';
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ?? '';
  if (!key || !host) return false;
  if (key === 'posthog_key' || host === 'posthog_host') return false;
  return /^https?:\/\//i.test(host);
}
