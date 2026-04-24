/**
 * Show migration status: what's applied, what's pending, what's on disk.
 * Usage: pnpm db:status
 */
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createPostgresClientFromEnv } from '../src/lib/server/db';

const MIGRATIONS_DIR = './supabase/migrations';

function hashFile(path: string): string {
  // drizzle computes sha256 over the file content with Unix line endings
  const content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(content).digest('hex');
}

async function main() {
  const c = createPostgresClientFromEnv({ prepare: false });

  try {
    const applied = await c<{ hash: string }[]>`
      SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id
    `.catch(() => [] as { hash: string }[]);
    const appliedHashes = new Set(applied.map((r) => r.hash));

    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    const hostLabel = `${process.env.DB_HOST}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME}`;
    console.log(`DB: ${hostLabel}`);
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
