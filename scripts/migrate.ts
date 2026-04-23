/**
 * Programmatic migrate runner — bypass drizzle-kit CLI to get reliable SSL +
 * error reporting. Reads DATABASE_URL, auto-enables TLS for non-localhost
 * hosts, applies everything in supabase/migrations/ that isn't already in
 * drizzle.__drizzle_migrations.
 *
 * Usage: pnpm tsx scripts/migrate.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const isLocal = /127\.0\.0\.1|localhost/.test(url);
  const client = postgres(url, {
    max: 1,
    prepare: false,
    ssl: isLocal ? false : 'require',
    connect_timeout: 15,
    onnotice: () => {}, // silence NOTICE spam from IF NOT EXISTS etc
  });

  const db = drizzle(client);
  console.log(`connecting to ${new URL(url).host} (ssl=${!isLocal})...`);
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
