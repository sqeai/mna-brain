import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL!;
// Local Postgres doesn't need TLS; managed Postgres (RDS / Neon / etc.)
// usually requires it. Auto-detect from the host.
const isLocal = /127\.0\.0\.1|localhost/.test(url);

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
