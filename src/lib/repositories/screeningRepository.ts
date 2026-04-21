import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

type ScreeningWithRelations = Pick<
  Tables<'screenings'>,
  'id' | 'company_id' | 'criteria_id' | 'state' | 'result' | 'remarks' | 'created_at' | 'updated_at'
> & {
  company: Pick<Tables<'companies'>, 'target' | 'pipeline_stage'> | null;
  criterias: Pick<Tables<'criterias'>, 'id' | 'name' | 'prompt'> | null;
};

type PreparedScreening = Pick<Tables<'screenings'>, 'id' | 'company_id' | 'criteria_id'>;

export class ScreeningRepository {
  constructor(private readonly db: DbClient) {}

  async findAllWithRelations(opts: {
    companyId?: string;
    onlyL0?: boolean;
  } = {}): Promise<ScreeningWithRelations[]> {
    let query = this.db
      .from('screenings')
      .select(
        'id, company_id, criteria_id, state, result, remarks, created_at, updated_at, company:companies(target, pipeline_stage), criterias(id, name, prompt)',
      )
      .order('created_at', { ascending: false });

    if (opts.companyId) query = query.eq('company_id', opts.companyId);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as ScreeningWithRelations[];
    if (opts.onlyL0) {
      return rows.filter((row) => row.company?.pipeline_stage === 'L0');
    }
    return rows;
  }

  async insert(data: TablesInsert<'screenings'>): Promise<Tables<'screenings'>> {
    const { data: result, error } = await this.db
      .from('screenings')
      .insert(data)
      .select('*')
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: string, updates: TablesUpdate<'screenings'>): Promise<Tables<'screenings'>> {
    const { data, error } = await this.db
      .from('screenings')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * For each (companyId, criteriaId) pair: reset to pending if it exists, otherwise insert.
   * Returns the final row id + company_id + criteria_id for each pair.
   */
  async upsertOrReset(
    companyIds: string[],
    criteriaIds: string[],
  ): Promise<PreparedScreening[]> {
    const entries: PreparedScreening[] = [];

    for (const companyId of companyIds) {
      for (const criteriaId of criteriaIds) {
        const { data: existing } = await this.db
          .from('screenings')
          .select('id, company_id, criteria_id')
          .eq('company_id', companyId)
          .eq('criteria_id', criteriaId)
          .maybeSingle();

        if (existing) {
          const { data: updated, error } = await this.db
            .from('screenings')
            .update({ state: 'pending', result: null, remarks: null })
            .eq('id', existing.id)
            .select('id, company_id, criteria_id')
            .single();

          if (error) throw error;
          entries.push(updated as PreparedScreening);
        } else {
          const { data: inserted, error } = await this.db
            .from('screenings')
            .insert({ company_id: companyId, criteria_id: criteriaId, state: 'pending' })
            .select('id, company_id, criteria_id')
            .single();

          if (error) throw error;
          entries.push(inserted as PreparedScreening);
        }
      }
    }

    return entries;
  }
}
