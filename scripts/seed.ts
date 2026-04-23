/**
 * Local dev seed. Idempotent: re-running wipes prior seed rows (tagged via
 * `source = 'seed'` for companies, fixed email for the test user) and
 * reinserts them. Not for production.
 *
 * Usage: pnpm db:seed
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { companies, users } from '../src/lib/db/schema';

const SEED_USER_EMAIL = 'test@sqe.co.id';
const SEED_USER_PASSWORD = 'password';
const SEED_SOURCE_TAG = 'seed';

const seedCompanies = [
  {
    entry_id: 9001,
    target: 'Acme Robotics',
    segment: 'Industrial Automation',
    company_focus: 'Factory-floor robotic arms for SMB manufacturers',
    website: 'https://acme-robotics.example',
    geography: 'USA',
    ownership: 'Private',
    pipeline_stage: 'L0',
    status: 'active',
    watchlist_status: 'Active',
    revenue_2023_usd_mn: 42.1,
    revenue_2024_usd_mn: 58.7,
    ebitda_2023_usd_mn: 6.2,
    ebitda_2024_usd_mn: 9.4,
    ev_2024: 320,
  },
  {
    entry_id: 9002,
    target: 'Blue Harbor Logistics',
    segment: 'Freight Forwarding',
    company_focus: 'Cross-border trucking aggregator in SEA',
    website: 'https://blueharbor.example',
    geography: 'Indonesia',
    ownership: 'PE-backed',
    pipeline_stage: 'L1',
    status: 'active',
    watchlist_status: 'Active',
    revenue_2023_usd_mn: 120.0,
    revenue_2024_usd_mn: 134.5,
    ebitda_2023_usd_mn: 14.8,
    ebitda_2024_usd_mn: 18.1,
    ev_2024: 410,
  },
  {
    entry_id: 9003,
    target: 'Cinder Foods',
    segment: 'F&B / Packaged Goods',
    company_focus: 'Frozen ready-meals for urban retail',
    website: 'https://cinderfoods.example',
    geography: 'Singapore',
    ownership: 'Family-owned',
    pipeline_stage: 'L0',
    status: 'active',
    watchlist_status: 'Monitoring',
    revenue_2023_usd_mn: 22.3,
    revenue_2024_usd_mn: 28.9,
    ebitda_2023_usd_mn: 2.1,
    ebitda_2024_usd_mn: 3.6,
    ev_2024: 95,
  },
  {
    entry_id: 9004,
    target: 'Delta Neural',
    segment: 'AI / SaaS',
    company_focus: 'Voice AI for call-center QA',
    website: 'https://deltaneural.example',
    geography: 'India',
    ownership: 'VC-backed',
    pipeline_stage: 'L2',
    status: 'active',
    watchlist_status: 'Active',
    revenue_2023_usd_mn: 8.4,
    revenue_2024_usd_mn: 17.2,
    ebitda_2023_usd_mn: -1.2,
    ebitda_2024_usd_mn: 0.8,
    ev_2024: 180,
  },
  {
    entry_id: 9005,
    target: 'Ember Renewables',
    segment: 'Clean Energy',
    company_focus: 'Rooftop solar + storage for commercial estates',
    website: 'https://emberrenewables.example',
    geography: 'Vietnam',
    ownership: 'Private',
    pipeline_stage: 'L1',
    status: 'active',
    watchlist_status: 'Active',
    revenue_2023_usd_mn: 61.0,
    revenue_2024_usd_mn: 74.3,
    ebitda_2023_usd_mn: 9.1,
    ebitda_2024_usd_mn: 12.4,
    ev_2024: 280,
  },
  {
    entry_id: 9006,
    target: 'Ferrous Metalworks',
    segment: 'Heavy Manufacturing',
    company_focus: 'Precision steel components for auto OEMs',
    website: 'https://ferrousmw.example',
    geography: 'Thailand',
    ownership: 'Listed',
    pipeline_stage: 'L0',
    status: 'dropped',
    watchlist_status: 'Dropped',
    revenue_2023_usd_mn: 210.5,
    revenue_2024_usd_mn: 205.1,
    ebitda_2023_usd_mn: 22.0,
    ebitda_2024_usd_mn: 19.4,
    ev_2024: 540,
  },
  {
    entry_id: 9007,
    target: 'Glacier Health',
    segment: 'Healthcare Services',
    company_focus: 'Outpatient diagnostic chain',
    website: 'https://glacierhealth.example',
    geography: 'Philippines',
    ownership: 'Private',
    pipeline_stage: 'L1',
    status: 'active',
    watchlist_status: 'Active',
    revenue_2023_usd_mn: 44.7,
    revenue_2024_usd_mn: 53.8,
    ebitda_2023_usd_mn: 7.8,
    ebitda_2024_usd_mn: 10.9,
    ev_2024: 260,
  },
  {
    entry_id: 9008,
    target: 'Halcyon Media',
    segment: 'Digital Media',
    company_focus: 'Vertical publishing network for SEA SMBs',
    website: 'https://halcyonmedia.example',
    geography: 'Malaysia',
    ownership: 'Private',
    pipeline_stage: 'L0',
    status: 'active',
    watchlist_status: 'Monitoring',
    revenue_2023_usd_mn: 11.2,
    revenue_2024_usd_mn: 14.6,
    ebitda_2023_usd_mn: 1.4,
    ebitda_2024_usd_mn: 2.2,
    ev_2024: 72,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const isLocal = /127\.0\.0\.1|localhost/.test(url);
  const client = postgres(url, {
    max: 1,
    prepare: false,
    ssl: isLocal ? false : 'require',
    onnotice: () => {},
  });
  const db = drizzle(client);

  console.log(`seeding ${new URL(url).host}...`);

  try {
    // Users — remove any prior seed user, then insert fresh.
    await db.delete(users).where(eq(users.email, SEED_USER_EMAIL));
    await db.insert(users).values({
      name: 'Test User',
      email: SEED_USER_EMAIL,
      password: SEED_USER_PASSWORD,
    });
    console.log(`  ✓ user ${SEED_USER_EMAIL} (password: ${SEED_USER_PASSWORD})`);

    // Companies — clear prior seed rows (tagged via source='seed'), re-insert.
    await db.delete(companies).where(eq(companies.source, SEED_SOURCE_TAG));
    await db
      .insert(companies)
      .values(seedCompanies.map((c) => ({ ...c, source: SEED_SOURCE_TAG })));
    console.log(`  ✓ ${seedCompanies.length} companies`);

    console.log('done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('seed failed:');
  console.error(err);
  process.exit(1);
});
