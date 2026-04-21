import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

export interface CompanyFilters {
  id?: string;
  stage?: string;
  stageIn?: string[];
  excludeStage?: string;
  stageNotNull?: boolean;
  createdAfter?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
}

type CompanyLogRow = {
  id: string;
  action: string;
  created_at: string | null;
};

type ScreeningWithCriteria = Tables<'screenings'> & {
  criterias: Pick<Tables<'criterias'>, 'id' | 'name' | 'prompt'> | null;
};

type MatchedFile = Pick<
  Tables<'files'>,
  'id' | 'file_name' | 'file_link' | 'file_date' | 'created_at'
>;

export type CompanyDetails = {
  logs: CompanyLogRow[];
  notes: Tables<'deal_notes'>[];
  links: Tables<'deal_links'>[];
  documents: Tables<'deal_documents'>[];
  screenings: ScreeningWithCriteria[];
  matchedFiles: MatchedFile[];
};

export class CompanyRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<Tables<'companies'>> {
    const { data, error } = await this.db
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(filters: CompanyFilters = {}): Promise<Tables<'companies'>[]> {
    const {
      id,
      stage,
      stageIn,
      excludeStage,
      stageNotNull,
      createdAfter,
      orderBy = 'updated_at',
      orderDir = 'desc',
      limit,
    } = filters;

    let query = this.db.from('companies').select('*');

    if (id) query = query.eq('id', id);
    if (stage) query = query.eq('pipeline_stage', stage);
    if (stageIn && stageIn.length > 0) query = query.in('pipeline_stage', stageIn);
    if (excludeStage) query = query.neq('pipeline_stage', excludeStage);
    if (stageNotNull) query = query.not('pipeline_stage', 'is', null);
    if (createdAfter) query = query.gte('created_at', createdAfter);
    query = query.order(orderBy as keyof Tables<'companies'>, { ascending: orderDir === 'asc' });
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async count(filters: Omit<CompanyFilters, 'orderBy' | 'orderDir' | 'limit'> = {}): Promise<number> {
    const { id, stage, stageIn, excludeStage, stageNotNull, createdAfter } = filters;

    let query = this.db.from('companies').select('*', { head: true, count: 'exact' });

    if (id) query = query.eq('id', id);
    if (stage) query = query.eq('pipeline_stage', stage);
    if (stageIn && stageIn.length > 0) query = query.in('pipeline_stage', stageIn);
    if (excludeStage) query = query.neq('pipeline_stage', excludeStage);
    if (stageNotNull) query = query.not('pipeline_stage', 'is', null);
    if (createdAfter) query = query.gte('created_at', createdAfter);

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  async findTargetNames(): Promise<string[]> {
    const { data, error } = await this.db.from('companies').select('target');
    if (error) throw error;
    return (data ?? []).map((c) => c.target ?? '').filter(Boolean);
  }

  async insert(company: TablesInsert<'companies'>): Promise<Tables<'companies'>> {
    const { data, error } = await this.db
      .from('companies')
      .insert(company)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async insertMany(companies: TablesInsert<'companies'>[]): Promise<void> {
    const { error } = await this.db.from('companies').insert(companies);
    if (error) throw error;
  }

  async update(id: string, updates: TablesUpdate<'companies'>): Promise<Tables<'companies'>[]> {
    const { data, error } = await this.db
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select('*');

    if (error) throw error;
    return data ?? [];
  }

  async updateMany(ids: string[], updates: TablesUpdate<'companies'>): Promise<Tables<'companies'>[]> {
    const { data, error } = await this.db
      .from('companies')
      .update(updates)
      .in('id', ids)
      .select('*');

    if (error) throw error;
    return data ?? [];
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('companies').delete().eq('id', id);
    if (error) throw error;
  }

  async runL1Filters(id: string): Promise<unknown> {
    // run_l1_filters is a custom RPC not reflected in the generated types
    const { data, error } = await (this.db as unknown as {
      rpc: (fn: string, args: Record<string, string>) => Promise<{ data: unknown; error: Error | null }>;
    }).rpc('run_l1_filters', { deal_id_param: id });

    if (error) throw error;
    return data;
  }

  async findDetails(id: string): Promise<CompanyDetails> {
    const filesQuery = this.db
      .from('files')
      .select('id, file_name, file_link, file_date, created_at')
      .filter('matched_companies', 'cs', JSON.stringify([{ id }]))
      .order('created_at', { ascending: false })
      .limit(100);

    const [logsRes, notesRes, linksRes, docsRes, screeningsRes, filesRes] = await Promise.all([
      this.db
        .from('company_logs')
        .select('id, action, created_at')
        .eq('company_id', id)
        .order('created_at', { ascending: true }),
      this.db
        .from('deal_notes')
        .select('*')
        .eq('deal_id', id)
        .order('created_at', { ascending: false }),
      this.db
        .from('deal_links')
        .select('*')
        .eq('deal_id', id)
        .order('created_at', { ascending: false }),
      this.db
        .from('deal_documents')
        .select('*')
        .eq('deal_id', id)
        .order('created_at', { ascending: false }),
      this.db
        .from('screenings')
        .select('*, criterias(id, name, prompt)')
        .eq('company_id', id)
        .order('created_at', { ascending: false }),
      filesQuery,
    ]);

    return {
      logs: (logsRes.data ?? []) as CompanyLogRow[],
      notes: notesRes.data ?? [],
      links: linksRes.data ?? [],
      documents: docsRes.data ?? [],
      screenings: (screeningsRes.data ?? []) as ScreeningWithCriteria[],
      matchedFiles: (filesRes.data ?? []) as MatchedFile[],
    };
  }
}
