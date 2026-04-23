import { and, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { pastAcquisitions } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert } from './types';

export interface PastAcquisitionAgentFilters {
  sector?: string;
  country?: string;
  status?: string;
  projectType?: string;
  year?: string;
  searchTerm?: string;
  limit?: number;
}

type PastAcquisitionLookup = Pick<Tables<'past_acquisitions'>, 'project_name' | 'target_co_partner'>;

export class PastAcquisitionRepository {
  constructor(private readonly db: DbClient) {}

  async findAllIdAndName(): Promise<Array<{ id: string; project_name: string | null }>> {
    return this.db
      .select({ id: pastAcquisitions.id, project_name: pastAcquisitions.project_name })
      .from(pastAcquisitions);
  }

  async findByCodename(codename: string): Promise<PastAcquisitionLookup | null> {
    const [row] = await this.db
      .select({
        project_name: pastAcquisitions.project_name,
        target_co_partner: pastAcquisitions.target_co_partner,
      })
      .from(pastAcquisitions)
      .where(ilike(pastAcquisitions.project_name, codename))
      .limit(1);
    return row ?? null;
  }

  async findAll(): Promise<Tables<'past_acquisitions'>[]> {
    return this.db.select().from(pastAcquisitions);
  }

  async findByNameFuzzy(namePart: string): Promise<Tables<'past_acquisitions'> | null> {
    const [row] = await this.db
      .select()
      .from(pastAcquisitions)
      .where(ilike(pastAcquisitions.project_name, `%${namePart}%`))
      .limit(1);
    return row ?? null;
  }

  async searchForAgent(
    filters: PastAcquisitionAgentFilters,
  ): Promise<Tables<'past_acquisitions'>[]> {
    const conditions: (SQL | undefined)[] = [];
    if (filters.sector) conditions.push(ilike(pastAcquisitions.sector, `%${filters.sector}%`));
    if (filters.country) conditions.push(ilike(pastAcquisitions.country, `%${filters.country}%`));
    if (filters.status) conditions.push(ilike(pastAcquisitions.status, `%${filters.status}%`));
    if (filters.projectType) {
      conditions.push(ilike(pastAcquisitions.project_type, `%${filters.projectType}%`));
    }
    if (filters.year) conditions.push(eq(pastAcquisitions.year, filters.year));
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      conditions.push(
        or(
          ilike(pastAcquisitions.project_name, term),
          ilike(pastAcquisitions.target_co_partner, term),
          ilike(pastAcquisitions.sector, term),
          ilike(pastAcquisitions.country, term),
        ),
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = Math.min(filters.limit ?? 50, 50);
    return this.db.select().from(pastAcquisitions).where(where).limit(limit);
  }

  async findNotesById(id: string): Promise<string | null> {
    const [row] = await this.db
      .select({ notes: pastAcquisitions.notes })
      .from(pastAcquisitions)
      .where(eq(pastAcquisitions.id, id))
      .limit(1);
    return row?.notes ?? null;
  }

  async updateNotes(id: string, notes: string): Promise<void> {
    await this.db
      .update(pastAcquisitions)
      // Double-cast via `unknown`: `sql\`now()\`` isn't a plain string so it doesn't
      // match `Partial<$inferSelect>`. Drizzle accepts SQL fragments at runtime.
      .set({ notes, updated_at: sql`now()` } as unknown as TablesInsert<'past_acquisitions'>)
      .where(eq(pastAcquisitions.id, id));
  }
}
