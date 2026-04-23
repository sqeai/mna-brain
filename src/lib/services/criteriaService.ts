import type { CriteriaRepository } from '@/lib/repositories';

export class CriteriaService {
  constructor(private readonly criteriaRepo: CriteriaRepository) {}

  findAll() {
    return this.criteriaRepo.findAll();
  }

  create(name: string, prompt: string) {
    return this.criteriaRepo.insert({ name, prompt });
  }

  update(id: string, name: string, prompt: string) {
    return this.criteriaRepo.update(id, { name, prompt });
  }

  delete(id: string) {
    return this.criteriaRepo.delete(id);
  }
}
