import { test, expect, Page } from '@playwright/test';

const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed',
  created_at: new Date().toISOString(),
};

type FileRecord = {
  id: string;
  file_name: string;
  raw_notes: string | null;
  structured_notes: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  tags: string[];
  matched_companies: Array<{ id?: string; name?: string; type?: string }>;
  signed_url?: string;
  file_date: string | null;
  created_at: string;
  updated_at: string;
};

const baseFile = (overrides: Partial<FileRecord>): FileRecord => ({
  id: 'f-0',
  file_name: 'example.pdf',
  raw_notes: null,
  structured_notes: null,
  processing_status: 'completed',
  tags: [],
  matched_companies: [],
  signed_url: undefined,
  file_date: '2026-01-15',
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  ...overrides,
});

const MOM_FILES: FileRecord[] = [
  baseFile({ id: 'mom-1', file_name: 'Board Meeting March.pdf', processing_status: 'completed', tags: ['quarterly', 'board'] }),
  baseFile({ id: 'mom-2', file_name: 'Investor Call Q1.pdf', processing_status: 'processing', tags: ['investors'] }),
];

const PROSPECTUS_FILES: FileRecord[] = [
  baseFile({ id: 'pro-1', file_name: 'Acme Prospectus.pdf', processing_status: 'completed' }),
];

const OTHER_FILES: FileRecord[] = [
  baseFile({ id: 'oth-1', file_name: 'Misc Notes.pdf', processing_status: 'pending' }),
];

/**
 * /api/ai-file-dump is dispatched by the `file_type` query param:
 *   ?file_type           → MoM (empty value ⇒ default list)
 *   ?file_type=prospectus → Prospectus
 *   ?file_type=other     → Other
 */
const mockFileDump = (
  page: Page,
  opts?: { mom?: FileRecord[]; prospectus?: FileRecord[]; other?: FileRecord[] },
) => {
  const mom = opts?.mom ?? MOM_FILES;
  const prospectus = opts?.prospectus ?? PROSPECTUS_FILES;
  const other = opts?.other ?? OTHER_FILES;

  return page.route('**/api/ai-file-dump**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    // Delete endpoint: /api/ai-file-dump/<id>
    if (method === 'DELETE' && /\/api\/ai-file-dump\/[^/]+$/.test(url.pathname)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }

    if (method === 'GET' && url.pathname === '/api/ai-file-dump') {
      const fileType = url.searchParams.get('file_type');
      if (fileType === 'prospectus') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: prospectus }),
        });
      }
      if (fileType === 'other') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: other }),
        });
      }
      // Default (MoM) – the empty-value `?file_type` sentinel.
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mom }),
      });
    }

    return route.fallback();
  });
};

const authenticate = async (page: Page) => {
  await page.addInitScript((user) => {
    localStorage.setItem('mna_tracker_user', JSON.stringify(user));
  }, MOCK_USER);
};

test.describe('AI File Dump page', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('redirects to /login when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => localStorage.removeItem('mna_tracker_user'));

    await page.goto('/ai-file-dump');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('renders header, upload zone and three file tables', async ({ page }) => {
    await mockFileDump(page);

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    await expect(page.getByRole('heading', { name: 'AI File Dump', level: 1 })).toBeVisible();
    await expect(page.getByText('Drop your files and let AI automatically organize and categorize them')).toBeVisible();

    // Upload zone — the CardTitle uses h3, the inner hint is a <p>. Use a heading
    // locator so we don't match both.
    await expect(page.getByRole('heading', { name: 'Drag and drop files' })).toBeVisible();
    await expect(page.getByText(/Drag and drop files here/)).toBeVisible();

    // Tables titled with counts
    await expect(page.getByText(`MoM (${MOM_FILES.length})`)).toBeVisible();
    await expect(page.getByText(`Prospectus (${PROSPECTUS_FILES.length})`)).toBeVisible();
    await expect(page.getByText(`Other (${OTHER_FILES.length})`)).toBeVisible();

    // Rows from each table
    await expect(page.getByText('Board Meeting March.pdf')).toBeVisible();
    await expect(page.getByText('Acme Prospectus.pdf')).toBeVisible();
    await expect(page.getByText('Misc Notes.pdf')).toBeVisible();
  });

  test('shows per-table empty states when no files exist', async ({ page }) => {
    await mockFileDump(page, { mom: [], prospectus: [], other: [] });

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    await expect(page.getByText('No MoM uploaded yet.')).toBeVisible();
    await expect(page.getByText('No prospectus uploaded yet.')).toBeVisible();
    await expect(page.getByText('No other files uploaded yet.')).toBeVisible();
  });

  test('loading spinner is visible until the fetches resolve', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });

    await page.route('**/api/ai-file-dump**', async (route) => {
      await gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/ai-file-dump');

    // While fetches are gated the main header hasn't rendered yet.
    await expect(page.getByRole('heading', { name: 'AI File Dump', level: 1 })).not.toBeVisible();

    release();
    await expect(page.getByRole('heading', { name: 'AI File Dump', level: 1 })).toBeVisible();
  });

  test('selecting a file via browse input adds it to the selection list', async ({ page }) => {
    await mockFileDump(page);

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'new-report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('hello world'),
    });

    await expect(page.getByText('Selected Files (1)')).toBeVisible();
    await expect(page.getByText('new-report.pdf', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload File/ })).toBeVisible();
  });

  test('duplicate filename is flagged in the selection list', async ({ page }) => {
    await mockFileDump(page);

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    // Upload a file whose name matches an existing MoM entry.
    await page.locator('input[type="file"]').setInputFiles({
      name: 'Board Meeting March.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dup'),
    });

    await expect(page.getByText('Duplicate').first()).toBeVisible();
  });

  test('clear-all removes selected files', async ({ page }) => {
    await mockFileDump(page);

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'alpha.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('a'),
    });
    await expect(page.getByText('Selected Files (1)')).toBeVisible();

    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(page.getByText('Selected Files (1)')).not.toBeVisible();
  });

  test('search filters the MoM table', async ({ page }) => {
    await mockFileDump(page);

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    // Three tables render with identical search placeholders (MoM, Prospectus, Other).
    // MoM renders first, so target the first one.
    await page.getByPlaceholder('Search notes, tags, companies...').first().fill('Board');

    await expect(page.getByText(`MoM (1)`)).toBeVisible();
    await expect(page.getByText('Board Meeting March.pdf')).toBeVisible();
    await expect(page.getByText('Investor Call Q1.pdf')).not.toBeVisible();
  });

  test('delete flow confirms then sends DELETE /api/ai-file-dump/<id>', async ({ page }) => {
    await mockFileDump(page);

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    const row = page.getByRole('row').filter({ hasText: 'Board Meeting March.pdf' });
    // The delete button is the only one with text-destructive styling in the row.
    await row.locator('button.text-destructive').click();

    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText('Board Meeting March.pdf')).toBeVisible();

    const [deleteReq] = await Promise.all([
      page.waitForRequest((r) => r.method() === 'DELETE' && r.url().includes('/api/ai-file-dump/')),
      confirm.getByRole('button', { name: 'Delete', exact: true }).click(),
    ]);
    expect(deleteReq.url()).toContain('/api/ai-file-dump/mom-1');
  });

  test('AI CoPilot tab navigates to /ai-discovery', async ({ page }) => {
    await mockFileDump(page);

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ai-file-dump') && res.status() === 200),
      page.goto('/ai-file-dump'),
    ]);

    // Two "AI CoPilot" elements exist (sidebar + tab). The tab is the <button> one.
    await page.getByRole('button', { name: /AI CoPilot/ }).click();
    await page.waitForURL('**/ai-discovery');
    await expect(page).toHaveURL(/\/ai-discovery/);
  });
});
