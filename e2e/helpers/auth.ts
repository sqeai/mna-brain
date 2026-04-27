import type { Page } from '@playwright/test';

export const MOCK_USER = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
};

export type MockSessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Stub NextAuth's `/api/auth/session` so `useSession()` resolves with a
 * predictable user (or `null` for unauthenticated). The app moved from a
 * localStorage-based auth to NextAuth (JWT session cookies) — setting
 * localStorage no longer makes `useSession()` return a user.
 *
 * Returns a `setUser` function so a single registered route can flip between
 * unauthenticated and authenticated state mid-test (e.g. before vs. after a
 * successful sign-in).
 */
export const mockAuthSession = async (
  page: Page,
  initialUser: MockSessionUser | null = MOCK_USER,
) => {
  let currentUser: MockSessionUser | null = initialUser;
  await page.route('**/api/auth/session', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        currentUser
          ? {
              user: currentUser,
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }
          : null,
      ),
    });
  });

  return {
    setUser: (user: MockSessionUser | null) => {
      currentUser = user;
    },
  };
};

/**
 * Stub the NextAuth credentials sign-in flow used by `signIn('credentials', …)`:
 *   1. GET  /api/auth/csrf                 → returns a fake csrf token
 *   2. POST /api/auth/callback/credentials → returns `{ url }` whose query
 *      string carries the error (or the success redirect target).
 *
 * Pass `errorCode` to simulate a failed login. `next-auth` surfaces the value
 * from `?error=` as the `error` field in the resolved object, which our
 * `useAuth.signIn` then wraps as `new Error(errorCode)`.
 */
export const mockNextAuthSignIn = async (
  page: Page,
  opts: { errorCode?: string; redirectUrl?: string; delayMs?: number } = {},
) => {
  await page.route(/\/api\/auth\/csrf/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: 'test-csrf-token' }),
    }),
  );

  // next-auth v5's `signIn()` fetches `/api/auth/providers` before the actual
  // credentials POST. Without this, the dev server's UntrustedHost check
  // short-circuits the flow and the page bounces to /api/auth/error.
  await page.route(/\/api\/auth\/providers/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        credentials: {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
          signinUrl: 'http://localhost:3000/api/auth/signin/credentials',
          callbackUrl: 'http://localhost:3000/api/auth/callback/credentials',
        },
      }),
    }),
  );

  await page.route(/\/api\/auth\/callback\/credentials/, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    if (opts.delayMs) {
      await new Promise((r) => setTimeout(r, opts.delayMs));
    }
    const url = opts.errorCode
      ? `http://localhost:3000/login?error=${opts.errorCode}`
      : opts.redirectUrl ?? 'http://localhost:3000/dashboard';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url }),
    });
  });
};
