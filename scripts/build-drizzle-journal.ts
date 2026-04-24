/**
 * Generate drizzle-kit's migration journal from the drizzle/migrations folder.
 *
 * Drizzle's migrator reads `meta/_journal.json` (ordered list of migration tags)
 * to decide what to run; Supabase authors SQL files with timestamp-prefixed
 * names but doesn't emit that journal. This script scans the folder, sorts by
 * filename (which is chronological because of the `YYYYMMDDHHMMSS_` prefix),
 * parses the timestamp, and writes the journal drizzle-kit expects.
 *
 * Run before `drizzle-kit migrate` (or wire it up in the `db:migrate` script).
 */
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = './drizzle/migrations';
const META_DIR = join(MIGRATIONS_DIR, 'meta');

type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

function parseTimestamp(tag: string, fallbackIdx: number): number {
  const match = tag.match(/^(\d{14})/);
  if (!match) {
    // No timestamp prefix (e.g. drizzle-generated `0000_name.sql`) — use a
    // monotonically increasing synthetic timestamp so ordering stays stable.
    return fallbackIdx;
  }
  const s = match[1];
  return Date.UTC(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)) - 1,
    Number(s.slice(6, 8)),
    Number(s.slice(8, 10)),
    Number(s.slice(10, 12)),
    Number(s.slice(12, 14)),
  );
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const entries: JournalEntry[] = files.map((file, idx) => {
  const tag = file.replace(/\.sql$/, '');
  return {
    idx,
    version: '7',
    when: parseTimestamp(tag, idx),
    tag,
    breakpoints: true,
  };
});

mkdirSync(META_DIR, { recursive: true });
writeFileSync(
  join(META_DIR, '_journal.json'),
  JSON.stringify({ version: '7', dialect: 'postgresql', entries }, null, 2) + '\n',
);

console.log(`Wrote ${join(META_DIR, '_journal.json')} with ${entries.length} entries.`);
