import { test, expect, Page } from '@playwright/test';

const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed',
  created_at: new Date().toISOString(),
};

const authenticate = async (page: Page) => {
  await page.addInitScript((user) => {
    localStorage.setItem('mna_tracker_user', JSON.stringify(user));
    // Clear any prior chat history so the welcome state renders predictably.
    localStorage.removeItem('mna-chat-history');
  }, MOCK_USER);
};

/** Stub the streaming /api/chat endpoint so sending a message doesn't hit a real LLM. */
const mockChatEndpoint = (page: Page) =>
  page.route('**/api/chat', (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      // Minimal no-op stream – useChat just needs the request to complete.
      body: '',
    });
  });

test.describe('AI Discovery page', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('redirects to /login when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => localStorage.removeItem('mna_tracker_user'));

    await page.goto('/ai-discovery');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('renders AI CoPilot header, tab bar and chat input', async ({ page }) => {
    await mockChatEndpoint(page);
    await page.goto('/ai-discovery');

    await expect(page.getByRole('heading', { name: 'AI CoPilot', level: 1 })).toBeVisible();
    await expect(page.getByText('Discover targets, analyze companies, and get intelligent insights instantly')).toBeVisible();
    await expect(page.getByText('AI Powered').first()).toBeVisible();

    // Tab bar: AI CoPilot (current) and AI File Dump (link). Scope to <main>
    // because the sidebar also has an "AI File Dump" nav link.
    const fileDumpLink = page.locator('main').getByRole('link', { name: /AI File Dump/ });
    await expect(fileDumpLink).toBeVisible();
    await expect(fileDumpLink).toHaveAttribute('href', '/ai-file-dump');

    await expect(
      page.getByPlaceholder('Ask about companies, analysis, comparisons, or pipeline performance...'),
    ).toBeVisible();
  });

  test('?tab=filedump redirects to /ai-file-dump', async ({ page }) => {
    // Stub the ai-file-dump fetches so the target page renders without backend.
    await page.route('**/api/ai-file-dump**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );

    await page.goto('/ai-discovery?tab=filedump');
    await page.waitForURL('**/ai-file-dump');
    await expect(page).toHaveURL(/\/ai-file-dump/);
  });

  test('suggestion chip populates the input', async ({ page }) => {
    await mockChatEndpoint(page);
    await page.goto('/ai-discovery');

    const input = page.getByPlaceholder('Ask about companies, analysis, comparisons, or pipeline performance...');

    const chip = page.locator('button.text-primary').first();
    const chipLabel = (await chip.textContent())?.replace(/^"|"[,]?$/g, '').trim() ?? '';
    await chip.click();

    await expect(input).toHaveValue(chipLabel);
  });

  test('send button is disabled for empty input and enabled after typing', async ({ page }) => {
    await mockChatEndpoint(page);
    await page.goto('/ai-discovery');

    const input = page.getByPlaceholder('Ask about companies, analysis, comparisons, or pipeline performance...');
    const sendBtn = input.locator('..').locator('button[type="submit"]');

    await expect(sendBtn).toBeDisabled();
    await input.fill('what companies are in L1?');
    await expect(sendBtn).toBeEnabled();
  });

  test('submitting a message POSTs to /api/chat', async ({ page }) => {
    await mockChatEndpoint(page);
    await page.goto('/ai-discovery');

    const input = page.getByPlaceholder('Ask about companies, analysis, comparisons, or pipeline performance...');
    await input.fill('hello');

    const [req] = await Promise.all([
      page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/api/chat')),
      input.press('Enter'),
    ]);

    expect(req.method()).toBe('POST');
  });

  test('clicking the AI File Dump tab navigates to /ai-file-dump', async ({ page }) => {
    await mockChatEndpoint(page);
    await page.route('**/api/ai-file-dump**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );

    await page.goto('/ai-discovery');
    // Use the in-page tab, not the sidebar nav link with the same text.
    await page.locator('main').getByRole('link', { name: /AI File Dump/ }).click();
    await page.waitForURL('**/ai-file-dump');
    await expect(page).toHaveURL(/\/ai-file-dump/);
  });
});
