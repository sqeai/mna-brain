/**
 * Show migration status: what's applied, what's pending, what's on disk.
 * Usage: pnpm db:status
 */
import { config } from 'dotenv';
// Load .env.local first (if present), then .env as a fallback. dotenv won't
// overwrite variables that are already set, so .env.local takes precedence.
config({ path: '.env.local' });
config();
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import postgres from 'postgres';

const MIGRATIONS_DIR = './supabase/migrations';

function hashFile(path: string): string {
  // drizzle computes sha256 over the file content with Unix line endings
  const content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(content).digest('hex');
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const isLocal = /127\.0\.0\.1|localhost/.test(url);
  const c = postgres(url, { max: 1, prepare: false, ssl: isLocal ? false : 'require' });

  try {
    const applied = await c<{ hash: string }[]>`
      SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id
    `.catch(() => [] as { hash: string }[]);
    const appliedHashes = new Set(applied.map((r) => r.hash));

    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    console.log(`DB: ${new URL(url).host}`);
    console.log(`Applied: ${appliedHashes.size}   On disk: ${files.length}\n`);

    for (const f of files) {
      const h = hashFile(join(MIGRATIONS_DIR, f));
      const mark = appliedHashes.has(h) ? '✓' : '✗';
      console.log(`  ${mark} ${f}`);
    }

    const pending = files.filter((f) => !appliedHashes.has(hashFile(join(MIGRATIONS_DIR, f)))).length;
    console.log(`\n${pending === 0 ? 'all migrations applied' : pending + ' pending'}`);
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
