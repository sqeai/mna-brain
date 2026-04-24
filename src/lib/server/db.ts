import { Signer } from '@aws-sdk/rds-signer';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

function rdsIamDbAuthFromEnv(): boolean {
  const v = process.env.RDS_IAM_DB_AUTH;
  return v === '1' || v === 'true' || v === 'yes';
}

/** Parse postgresql URL for host/port/db/user; password in URL is ignored when using IAM auth. */
function parsePostgresUrl(url: string): { host: string; port: number; database: string; user: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use postgresql:// (or postgres://)');
  }
  const path = parsed.pathname.replace(/^\//, '');
  const database = path.split('/')[0] ?? '';
  if (!database) {
    throw new Error('DATABASE_URL must include a database name in the path');
  }
  const user = decodeURIComponent(parsed.username);
  if (!user) {
    throw new Error('DATABASE_URL must include a username (use the IAM DB role, e.g. mna_iam)');
  }
  const port = parsed.port ? Number(parsed.port) : 5432;
  return { host: parsed.hostname, port, database, user };
}

async function rdsIamAuthToken(host: string, port: number, username: string): Promise<string> {
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error('Set AWS_REGION (or AWS_DEFAULT_REGION) for RDS IAM database authentication');
  }
  const signer = new Signer({
    hostname: host,
    port,
    region,
    username,
  });
  return signer.getAuthToken();
}

const isPooler = connectionString.includes(':6543');
const isLocal = /127\.0\.0\.1|localhost/.test(connectionString);
const useRdsIamDbAuth = rdsIamDbAuthFromEnv();

type PgClient = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as { __pg?: PgClient };

function createPostgresClient(): PgClient {
  if (useRdsIamDbAuth) {
    const { host, port, database, user } = parsePostgresUrl(connectionString);
    return postgres({
      host,
      port,
      database,
      user,
      password: () => rdsIamAuthToken(host, port, user),
      ssl: 'require',
      prepare: !isPooler,
      max: isPooler ? 1 : 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return postgres(connectionString, {
    prepare: !isPooler,
    max: isPooler ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isLocal ? false : 'require',
  });
}

const client: PgClient = globalForDb.__pg ?? createPostgresClient();

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
