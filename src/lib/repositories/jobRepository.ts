import { asc, eq } from 'drizzle-orm';
import { jobs, jobLogs } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert, TablesUpdate } from './types';

type Job = Tables<'jobs'>;
type JobLog = Tables<'job_logs'>;
type JobStatus = Job['status'];

export type JobWithLogs = Job & { logs: JobLog[] };

export class JobRepository {
  constructor(private readonly db: DbClient) {}

  async create(input: TablesInsert<'jobs'>): Promise<Job> {
    const [row] = await this.db.insert(jobs).values(input).returning();
    return row;
  }

  async findById(id: string): Promise<Job | null> {
    const [row] = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return row ?? null;
  }

  async findByIdWithLogs(id: string): Promise<JobWithLogs | null> {
    const job = await this.findById(id);
    if (!job) return null;

    const logs = await this.db
      .select()
      .from(jobLogs)
      .where(eq(jobLogs.job_id, id))
      .orderBy(asc(jobLogs.created_at));

    return { ...job, logs };
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

    await this.db.insert(jobLogs).values({
      job_id: jobId,
      from_status: job.status,
      to_status: job.status,
      message: entry.message ?? null,
      metadata: (entry.metadata ?? null) as JobLog['metadata'],
    } as TablesInsert<'job_logs'>);
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
    const [row] = await this.db
      .update(jobs)
      .set(patch as TablesUpdate<'jobs'>)
      .where(eq(jobs.id, id))
      .returning();
    if (!row) throw new Error(`Job ${id} not found`);
    return row;
  }
}
