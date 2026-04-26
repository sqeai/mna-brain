import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CompanyRepository,
  CompanyLogRepository,
  DealDocumentRepository,
  DealNoteRepository,
  DealLinkRepository,
} from '@/lib/repositories';
import type { Tables } from '@/lib/repositories';
import { CompanyService } from './companyService';

vi.mock('@/lib/s3', () => ({ deleteFile: vi.fn() }));

import { deleteFile } from '@/lib/s3';

afterEach(() => vi.clearAllMocks());

type Company = Tables<'companies'>;

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 'company-1',
    target: 'Acme Corp',
    pipeline_stage: 'L0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Company;
}

function makeRepos() {
  const companyRepo = {
    findById: vi.fn(),
    findAll: vi.fn(),
    count: vi.fn(),
    findDetails: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    runL1Filters: vi.fn(),
  } as unknown as CompanyRepository;

  const companyLogRepo = {
    insert: vi.fn(),
    insertMany: vi.fn(),
  } as unknown as CompanyLogRepository;

  const dealDocRepo = {
    findFilePathsByDealId: vi.fn(),
    delete: vi.fn(),
  } as unknown as DealDocumentRepository;

  const dealNoteRepo = { insert: vi.fn() } as unknown as DealNoteRepository;
  const dealLinkRepo = { insert: vi.fn() } as unknown as DealLinkRepository;

  return { companyRepo, companyLogRepo, dealDocRepo, dealNoteRepo, dealLinkRepo };
}

describe('CompanyService.create', () => {
  it('inserts a log when logAction is provided', async () => {
    const repos = makeRepos();
    const company = makeCompany();
    vi.mocked(repos.companyRepo.insert).mockResolvedValue(company);
    const service = new CompanyService(repos.companyRepo, repos.companyLogRepo, repos.dealDocRepo, repos.dealNoteRepo, repos.dealLinkRepo);

    await service.create({ target: 'Acme' } as any, 'CREATED');

    expect(repos.companyLogRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ company_id: company.id, action: 'CREATED' }),
    );
  });

  it('does not insert a log when logAction is omitted', async () => {
    const repos = makeRepos();
    vi.mocked(repos.companyRepo.insert).mockResolvedValue(makeCompany());
    const service = new CompanyService(repos.companyRepo, repos.companyLogRepo, repos.dealDocRepo, repos.dealNoteRepo, repos.dealLinkRepo);

    await service.create({ target: 'Acme' } as any);

    expect(repos.companyLogRepo.insert).not.toHaveBeenCalled();
  });
});

describe('CompanyService.delete', () => {
  it('deletes each S3 file before removing the DB record', async () => {
    const repos = makeRepos();
    vi.mocked(repos.dealDocRepo.findFilePathsByDealId).mockResolvedValue(['a/file.pdf', 'b/file.pdf']);
    const service = new CompanyService(repos.companyRepo, repos.companyLogRepo, repos.dealDocRepo, repos.dealNoteRepo, repos.dealLinkRepo);

    await service.delete('company-1');

    expect(deleteFile).toHaveBeenCalledTimes(2);
    expect(deleteFile).toHaveBeenCalledWith('a/file.pdf');
    expect(deleteFile).toHaveBeenCalledWith('b/file.pdf');
    expect(repos.companyRepo.delete).toHaveBeenCalledWith('company-1');
  });

  it('skips S3 deletion when there are no documents', async () => {
    const repos = makeRepos();
    vi.mocked(repos.dealDocRepo.findFilePathsByDealId).mockResolvedValue([]);
    const service = new CompanyService(repos.companyRepo, repos.companyLogRepo, repos.dealDocRepo, repos.dealNoteRepo, repos.dealLinkRepo);

    await service.delete('company-1');

    expect(deleteFile).not.toHaveBeenCalled();
    expect(repos.companyRepo.delete).toHaveBeenCalledWith('company-1');
  });
});

describe('CompanyService.promote', () => {
  let repos: ReturnType<typeof makeRepos>;
  let service: CompanyService;

  beforeEach(() => {
    repos = makeRepos();
    service = new CompanyService(repos.companyRepo, repos.companyLogRepo, repos.dealDocRepo, repos.dealNoteRepo, repos.dealLinkRepo);
    vi.mocked(repos.companyRepo.update).mockResolvedValue(makeCompany());
  });

  it('uses PROMOTED_FROM_X_TO_Y format when currentStage is provided', async () => {
    await service.promote('company-1', 'L1', 'L2');
    expect(repos.companyLogRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROMOTED_FROM_L1_TO_L2' }),
    );
  });

  it('uses PROMOTED_TO_X format when currentStage is absent', async () => {
    await service.promote('company-1', undefined, 'L1');
    expect(repos.companyLogRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROMOTED_TO_L1' }),
    );
  });

  it('inserts a note when note is provided', async () => {
    await service.promote('company-1', 'L1', 'L2', 'Some note');
    expect(repos.dealNoteRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Some note', deal_id: 'company-1' }),
    );
  });

  it('does not insert a note when note is blank', async () => {
    await service.promote('company-1', 'L1', 'L2', '  ');
    expect(repos.dealNoteRepo.insert).not.toHaveBeenCalled();
  });

  it('inserts a link when linkUrl is provided', async () => {
    await service.promote('company-1', 'L1', 'L2', undefined, 'https://example.com', 'Report');
    expect(repos.dealLinkRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com', title: 'Report', deal_id: 'company-1' }),
    );
  });

  it('does not insert a link when linkUrl is blank', async () => {
    await service.promote('company-1', 'L1', 'L2', undefined, '  ');
    expect(repos.dealLinkRepo.insert).not.toHaveBeenCalled();
  });
});
