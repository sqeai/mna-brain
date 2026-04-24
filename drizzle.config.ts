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

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/drizzle',
  dbCredentials: {
    url: jdbcUrlForDrizzleKit(),
  },
  schemaFilter: ['public'],
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
