import type { JobRepository } from '@/lib/repositories';

export class JobService {
  constructor(private readonly jobRepo: JobRepository) {}

  findByIdWithLogs(id: string) {
    return this.jobRepo.findByIdWithLogs(id);
  }
}
