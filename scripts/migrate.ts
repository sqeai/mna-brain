/**
 * Programmatic migrate runner — bypass drizzle-kit CLI to get reliable SSL +
 * error reporting. Uses DB_* env via createPostgresClientFromEnv (TLS for RDS).
 * hosts, applies everything in supabase/migrations/ that isn't already in
 * drizzle.__drizzle_migrations.
 *
 * Usage: pnpm tsx scripts/migrate.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createPostgresClientFromEnv } from '../src/lib/server/db';

async function main() {
  const client = createPostgresClientFromEnv({
    connect_timeout: 15,
    prepare: false,
    onnotice: () => {}, // silence NOTICE spam from IF NOT EXISTS etc
  });

  const db = drizzle(client);
  const hostHint = `${process.env.DB_HOST}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME}`;
  console.log(`connecting to ${hostHint}...`);
  try {
    await migrate(db, {
      migrationsFolder: './supabase/migrations',
      migrationsTable: '__drizzle_migrations',
      migrationsSchema: 'drizzle',
    });
    console.log('✓ migrations applied');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('migrate failed:');
  console.error(err);
  process.exit(1);
});
