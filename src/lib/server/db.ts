import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

// PgBouncer transaction mode (Supabase pooler @ 6543) can't reuse prepared
// statement names across connections — disable prepare and cap app-side pool to 1.
const isPooler = connectionString.includes(':6543');
// Local / docker-internal Postgres doesn't speak TLS; managed Postgres (RDS,
// Supabase cloud, Neon, etc.) requires it. Auto-detect from the host:
//   - 127.0.0.1 / localhost → local
//   - bare hostname with no dot (e.g. "postgres", "db") → docker network, local
//   - anything with a dot → treat as FQDN, assume managed, require TLS
const isLocal = /@(127\.0\.0\.1|localhost|postgres)[:/]/.test(connectionString);

type PgClient = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as { __pg?: PgClient };

const client: PgClient =
  globalForDb.__pg ??
  postgres(connectionString, {
    prepare: !isPooler,
    max: isPooler ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isLocal ? false : 'require',
  });

// Note on timestamp shape: Drizzle's `timestamp({ mode: 'string' })` returns the
// raw Postgres textual form (e.g. "2026-04-22 12:40:36.427054+00") rather than
// the ISO 8601 form Supabase PostgREST used to produce. Both parse identically
// via `new Date(...)`, and a repo-wide grep confirms no caller does string-
// sensitive format checks (`.split('T')`, substring slicing, prefix comparison).
// If future code needs strict ISO, add `.$type<string>()` + a custom
// `mapFromDriverValue` on the relevant timestamp columns in `schema.ts`.

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pg = client;
}

export const db = drizzle(client, { schema });
export type DbClient = typeof db;

export function createDb(): DbClient {
  return db;
}
