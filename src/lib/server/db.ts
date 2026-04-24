import { Signer } from '@aws-sdk/rds-signer';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';

export type PostgresClientFromEnvOptions = {
  onnotice?: () => void;
  connect_timeout?: number;
  /** Override prepared statements (migrations often use prepare: false). */
  prepare?: boolean;
};

function rdsIamDbAuthFromEnv(): boolean {
  const v = process.env.RDS_IAM_DB_AUTH;
  return v === '1' || v === 'true' || v === 'yes';
}

function parseExplicitDbFromEnv(): {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
} | null {
  const host = process.env.DB_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.DB_PORT ?? '5432') || 5432;
  const database = process.env.DB_NAME?.trim();
  const user = process.env.DB_USER?.trim();
  if (!database || !user) {
    throw new Error('When DB_HOST is set, DB_NAME and DB_USER are required.');
  }
  const rawPw = process.env.DB_PASSWORD;
  const password = rawPw === undefined || rawPw === '' ? undefined : rawPw;
  return { host, port, database, user, password };
}

async function rdsIamAuthToken(host: string, port: number, username: string): Promise<string> {
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error('Set AWS_REGION (or AWS_DEFAULT_REGION) for RDS IAM database authentication');
  }
  const signer = new Signer({ hostname: host, port, region, username });
  return signer.getAuthToken();
}

/** True for local / docker-style hosts that typically do not use TLS. */
function isLocalPostgresHost(host: string): boolean {
  return (
    /^(127\.0\.0\.1|localhost)$/i.test(host) ||
    (host.length > 0 && !host.includes('.')) // e.g. service name "postgres" on docker network
  );
}

/** Postgres client from DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD (+ optional RDS_IAM_DB_AUTH). */
export function createPostgresClientFromEnv(
  extra: PostgresClientFromEnvOptions = {},
): ReturnType<typeof postgres> {
  const explicitDb = parseExplicitDbFromEnv();
  if (!explicitDb) {
    throw new Error(
      'Database not configured: set DB_HOST, DB_NAME, DB_USER, and DB_PORT (DB_PASSWORD empty when RDS_IAM_DB_AUTH=true).',
    );
  }

  const useIam = rdsIamDbAuthFromEnv();

  if (useIam && explicitDb.password) {
    throw new Error('With RDS_IAM_DB_AUTH, leave DB_PASSWORD empty; the app uses an IAM token instead.');
  }
  if (!useIam && explicitDb.password === undefined) {
    throw new Error('Without RDS_IAM_DB_AUTH, set DB_PASSWORD for the database user.');
  }

  const common = {
    prepare: true,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  } as const;

  const { host, port, database, user, password } = explicitDb;
  const isPooler = port === 6543;
  const poolCommon = {
    ...common,
    prepare: extra.prepare ?? !isPooler,
    max: isPooler ? 1 : 10,
    connect_timeout: extra.connect_timeout ?? 10,
    ...(extra.onnotice ? { onnotice: extra.onnotice } : {}),
  };

  if (useIam) {
    return postgres({
      host,
      port,
      database,
      user,
      password: () => rdsIamAuthToken(host, port, user),
      ssl: 'require',
      ...poolCommon,
    });
  }

  const useSsl = isLocalPostgresHost(host) ? false : 'require';

  return postgres({
    host,
    port,
    database,
    user,
    password: password!,
    ssl: useSsl,
    ...poolCommon,
  });
}

type PgClient = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as { __pg?: PgClient };

const client: PgClient = globalForDb.__pg ?? createPostgresClientFromEnv();

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
