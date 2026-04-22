import { test, expect } from '@playwright/test';

const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed',
  created_at: new Date().toISOString(),
};

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form', async ({ page }) => {
    await expect(page.getByText('BRAIN 2.0')).toBeVisible();
    await expect(page.locator('#signin-email')).toBeVisible();
    await expect(page.locator('#signin-password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/sign-in', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' }),
      }),
    );

    await page.locator('#signin-email').fill('wrong@example.com');
    await page.locator('#signin-password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('successful login redirects to /dashboard', async ({ page }) => {
    await page.route('**/api/auth/sign-in', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USER }),
      }),
    );

    await page.locator('#signin-email').fill('test@example.com');
    await page.locator('#signin-password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('disables form while submitting', async ({ page }) => {
    await page.route('**/api/auth/sign-in', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USER }),
      });
    });

    await page.locator('#signin-email').fill('test@example.com');
    await page.locator('#signin-password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.locator('#signin-email')).toBeDisabled();
    await expect(page.locator('#signin-password')).toBeDisabled();
    await expect(page.getByText('Signing in...')).toBeVisible();
  });

  test('redirects to /dashboard if already authenticated', async ({ page }) => {
    await page.addInitScript((user) => {
      localStorage.setItem('mna_tracker_user', JSON.stringify(user));
    }, MOCK_USER);

    await page.goto('/login');
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
