import type { DbClient, Tables, TablesInsert } from './types';

type Job = Tables<'jobs'>;
type JobLog = Tables<'job_logs'>;
type JobStatus = Tables<'jobs'>['status'];

export type JobWithLogs = Job & { logs: JobLog[] };

export class JobRepository {
  constructor(private readonly db: DbClient) {}

  async create(input: TablesInsert<'jobs'>): Promise<Job> {
    const { data, error } = await this.db
      .from('jobs')
      .insert(input)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<Job | null> {
    const { data, error } = await this.db
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  }

  async findByIdWithLogs(id: string): Promise<JobWithLogs | null> {
    const job = await this.findById(id);
    if (!job) return null;

    const { data, error } = await this.db
      .from('job_logs')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { ...job, logs: data ?? [] };
  }

  async markRunning(id: string): Promise<Job> {
    return this.updateStatus(id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });
  }

  async markCompleted(id: string, result: unknown): Promise<Job> {
    return this.updateStatus(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result: (result ?? null) as Job['result'],
      error: null,
    });
  }

  async markFailed(id: string, error: string): Promise<Job> {
    return this.updateStatus(id, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error,
    });
  }

  async markTimedOut(id: string, error: string): Promise<Job> {
    return this.updateStatus(id, {
      status: 'timed_out',
      completed_at: new Date().toISOString(),
      error,
    });
  }

  async appendLog(
    jobId: string,
    entry: { message?: string | null; metadata?: unknown },
  ): Promise<void> {
    const job = await this.findById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const { error } = await this.db.from('job_logs').insert({
      job_id: jobId,
      from_status: job.status,
      to_status: job.status,
      message: entry.message ?? null,
      metadata: (entry.metadata ?? null) as JobLog['metadata'],
    });

    if (error) throw error;
  }

  private async updateStatus(
    id: string,
    patch: {
      status: JobStatus;
      started_at?: string;
      completed_at?: string;
      result?: Job['result'];
      error?: string | null;
    },
  ): Promise<Job> {
    const { data, error } = await this.db
      .from('jobs')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}
