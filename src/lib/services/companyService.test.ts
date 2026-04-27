import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CompanyRepository,
  CompanyLogRepository,
  DealDocumentRepository,
  DealNoteRepository,
  DealLinkRepository,
} from '@/lib/repositories';
import { CompanyService } from './companyService';

function makeRepoStubs() {
  const companyRepo = {
    update: vi.fn().mockResolvedValue([]),
    setAssignees: vi.fn().mockResolvedValue(undefined),
    findAssignees: vi.fn().mockResolvedValue([]),
  } as unknown as CompanyRepository;
  const companyLogRepo = { insert: vi.fn().mockResolvedValue(undefined) } as unknown as CompanyLogRepository;
  const dealDocRepo = {} as DealDocumentRepository;
  const dealNoteRepo = { insert: vi.fn().mockResolvedValue({}) } as unknown as DealNoteRepository;
  const dealLinkRepo = { insert: vi.fn().mockResolvedValue({}) } as unknown as DealLinkRepository;
  return { companyRepo, companyLogRepo, dealDocRepo, dealNoteRepo, dealLinkRepo };
}

describe('CompanyService.dropDeal', () => {
  let stubs: ReturnType<typeof makeRepoStubs>;
  let service: CompanyService;

  beforeEach(() => {
    stubs = makeRepoStubs();
    service = new CompanyService(
      stubs.companyRepo,
      stubs.companyLogRepo,
      stubs.dealDocRepo,
      stubs.dealNoteRepo,
      stubs.dealLinkRepo,
    );
  });

  it('marks the company as dropped and writes a stage-aware log entry', async () => {
    await service.dropDeal('company-1', 'L2');

    expect(stubs.companyRepo.update).toHaveBeenCalledWith('company-1', { status: 'dropped' });
    expect(stubs.companyLogRepo.insert).toHaveBeenCalledWith({
      company_id: 'company-1',
      action: 'DROPPED_FROM_L2',
    });
    expect(stubs.dealNoteRepo.insert).not.toHaveBeenCalled();
  });

  it('falls back to a stageless log action when current stage is missing', async () => {
    await service.dropDeal('company-2', undefined);

    expect(stubs.companyLogRepo.insert).toHaveBeenCalledWith({
      company_id: 'company-2',
      action: 'DROPPED',
    });
  });

  it('persists a deal note when a non-blank reason is provided', async () => {
    await service.dropDeal('company-3', 'L1', '  competitor acquired them  ');

    expect(stubs.dealNoteRepo.insert).toHaveBeenCalledWith({
      deal_id: 'company-3',
      content: '  competitor acquired them  ',
      stage: 'L1',
    });
  });

  it('skips the deal note when the reason is blank or whitespace', async () => {
    await service.dropDeal('company-4', 'L0', '   ');

    expect(stubs.dealNoteRepo.insert).not.toHaveBeenCalled();
  });

  it('defaults the note stage to L0 when current stage is missing', async () => {
    await service.dropDeal('company-5', undefined, 'no fit');

    expect(stubs.dealNoteRepo.insert).toHaveBeenCalledWith({
      deal_id: 'company-5',
      content: 'no fit',
      stage: 'L0',
    });
  });
});

describe('CompanyService.restoreDeal', () => {
  let stubs: ReturnType<typeof makeRepoStubs>;
  let service: CompanyService;

  beforeEach(() => {
    stubs = makeRepoStubs();
    service = new CompanyService(
      stubs.companyRepo,
      stubs.companyLogRepo,
      stubs.dealDocRepo,
      stubs.dealNoteRepo,
      stubs.dealLinkRepo,
    );
  });

  it('clears the dropped status and writes a stage-aware log entry', async () => {
    await service.restoreDeal('company-1', 'L3');

    expect(stubs.companyRepo.update).toHaveBeenCalledWith('company-1', { status: null });
    expect(stubs.companyLogRepo.insert).toHaveBeenCalledWith({
      company_id: 'company-1',
      action: 'RESTORED_TO_L3',
    });
    expect(stubs.dealNoteRepo.insert).not.toHaveBeenCalled();
  });

  it('falls back to a stageless log action when current stage is missing', async () => {
    await service.restoreDeal('company-2', undefined);

    expect(stubs.companyLogRepo.insert).toHaveBeenCalledWith({
      company_id: 'company-2',
      action: 'RESTORED',
    });
  });
});

describe('CompanyService.promote (assignees)', () => {
  let stubs: ReturnType<typeof makeRepoStubs>;
  let service: CompanyService;

  beforeEach(() => {
    stubs = makeRepoStubs();
    service = new CompanyService(
      stubs.companyRepo,
      stubs.companyLogRepo,
      stubs.dealDocRepo,
      stubs.dealNoteRepo,
      stubs.dealLinkRepo,
    );
  });

  it('replaces assignees when an array is supplied', async () => {
    await service.promote('company-1', 'L1', 'L2', undefined, undefined, undefined, ['user-a', 'user-b']);

    expect(stubs.companyRepo.setAssignees).toHaveBeenCalledWith('company-1', ['user-a', 'user-b']);
  });

  it('clears assignees when an empty array is supplied', async () => {
    await service.promote('company-2', 'L1', 'L2', undefined, undefined, undefined, []);

    expect(stubs.companyRepo.setAssignees).toHaveBeenCalledWith('company-2', []);
  });

  it('leaves assignees untouched when not supplied', async () => {
    await service.promote('company-3', 'L1', 'L2');

    expect(stubs.companyRepo.setAssignees).not.toHaveBeenCalled();
  });
});
