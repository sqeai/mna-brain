import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

function rdsIamFromEnv(): boolean {
  const v = process.env.RDS_IAM_DB_AUTH;
  return v === '1' || v === 'true' || v === 'yes';
}

function jdbcUrlForDrizzleKit(): string {
  if (rdsIamFromEnv()) {
    throw new Error(
      'drizzle-kit: RDS_IAM_DB_AUTH is set but drizzle-kit cannot use IAM tokens. Unset RDS_IAM_DB_AUTH and set DB_USER/DB_PASSWORD to a user with a static password (e.g. master), or use pnpm db:migrate instead.',
    );
  }
  const host = process.env.DB_HOST?.trim();
  const name = process.env.DB_NAME?.trim();
  const user = process.env.DB_USER?.trim();
  const port = process.env.DB_PORT ?? '5432';
  const pw = process.env.DB_PASSWORD ?? '';
  if (!host || !name || !user) {
    throw new Error('drizzle-kit: set DB_HOST, DB_NAME, DB_USER, DB_PORT, and DB_PASSWORD.');
  }
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pw)}@${host}:${port}/${encodeURIComponent(name)}`;
}

const url = jdbcUrlForDrizzleKit();
const host = process.env.DB_HOST?.trim() ?? '';
const isLocal =
  /^(127\.0\.0\.1|localhost)$/i.test(host) ||
  (host.length > 0 && !host.includes('.'));

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  // Migrations live under drizzle/migrations/. SQL files are hand-authored
  // (see scripts/new-migration.ts) and the journal is rebuilt on every
  // `pnpm db:migrate` by scripts/build-drizzle-journal.ts.
  out: './drizzle/migrations',
  dbCredentials: {
    url,
    ssl: isLocal ? false : 'require',
  },
  schemaFilter: ['public'],
  casing: 'snake_case',
  migrations: {
    table: '__drizzle_migrations',
    schema: 'drizzle',
  },
  verbose: true,
  strict: true,
});
