import type * as schema from '@/lib/db/schema';
import type { DbClient } from '@/lib/server/db';

export type { DbClient };

// Map of public table names (as used in DB / legacy Supabase code) to their
// Drizzle schema exports.
type TableMap = {
  companies: typeof schema.companies;
  company_logs: typeof schema.companyLogs;
  company_analyses: typeof schema.companyAnalyses;
  company_slides: typeof schema.companySlides;
  company_criterias: typeof schema.companyCriterias;
  criterias: typeof schema.criterias;
  deal_documents: typeof schema.dealDocuments;
  deal_links: typeof schema.dealLinks;
  deal_notes: typeof schema.dealNotes;
  deal_stage_history: typeof schema.dealStageHistory;
  files: typeof schema.files;
  investment_thesis: typeof schema.investmentThesis;
  inven_cache: typeof schema.invenCache;
  jobs: typeof schema.jobs;
  job_logs: typeof schema.jobLogs;
  past_acquisitions: typeof schema.pastAcquisitions;
  reset_password_tokens: typeof schema.resetPasswordTokens;
  screenings: typeof schema.screenings;
  users: typeof schema.users;
};

export type Tables<T extends keyof TableMap> = TableMap[T]['$inferSelect'];

// NOTE: Drizzle's $inferInsert narrows incorrectly under strictNullChecks: false
// (keys of nullable columns disappear). We merge it with Partial<Select> so
// every column is a valid key, while required non-null columns stay required.
export type TablesInsert<T extends keyof TableMap> =
  TableMap[T]['$inferInsert'] &
  Partial<Omit<TableMap[T]['$inferSelect'], keyof TableMap[T]['$inferInsert']>>;

export type TablesUpdate<T extends keyof TableMap> = Partial<TableMap[T]['$inferSelect']>;
