/**
 * Scaffold a new empty migration file with a UTC timestamp prefix.
 * Replaces `supabase migration new` now that the Supabase CLI is gone.
 *
 * Usage: pnpm db:migration:new <name>
 * Writes: drizzle/migrations/<YYYYMMDDHHMMSS>_<slug>.sql
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const name = process.argv[2];
if (!name) {
  console.error('usage: pnpm db:migration:new <name>');
  process.exit(1);
}

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const ts =
  `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
  `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;

const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

if (!slug) {
  console.error('name must contain at least one alphanumeric character');
  process.exit(1);
}

const path = join('./drizzle/migrations', `${ts}_${slug}.sql`);
writeFileSync(path, `-- ${name}\n`, { flag: 'wx' });
console.log(path);
