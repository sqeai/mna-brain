import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { CompanyRepository, CompanyLogRepository, DealDocumentRepository } from '@/lib/repositories';

function parseBool(value: string | null) {
  return value === 'true' || value === '1';
}

export async function GET(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);
    const params = req.nextUrl.searchParams;

    const id = params.get('id') ?? undefined;
    const stage = params.get('stage') ?? undefined;
    const stageIn = params.get('stageIn')
      ? params.get('stageIn')!.split(',').filter(Boolean)
      : undefined;
    const excludeStage = params.get('excludeStage') ?? undefined;
    const stageNotNull = parseBool(params.get('stageNotNull'));
    const createdAfter = params.get('createdAfter') ?? undefined;
    const orderBy = params.get('orderBy') ?? 'updated_at';
    const orderDir = (params.get('orderDir') ?? 'desc') as 'asc' | 'desc';
    const limit = params.get('limit') ? Number(params.get('limit')) : undefined;
    const countOnly = parseBool(params.get('countOnly'));

    if (countOnly) {
      const count = await companyRepo.count({
        id,
        stage,
        stageIn,
        excludeStage,
        stageNotNull,
        createdAfter,
      });
      return NextResponse.json({ data: { count } });
    }

    if (id) {
      const data = await companyRepo.findById(id);
      return NextResponse.json({ data });
    }

    const data = await companyRepo.findAll({
      stage,
      stageIn,
      excludeStage,
      stageNotNull,
      createdAfter,
      orderBy,
      orderDir,
      limit,
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch companies';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);
    const companyLogRepo = new CompanyLogRepository(db);
    const body = await req.json();
    const { company, logAction } = body;

    const data = await companyRepo.insert(company);

    if (logAction) {
      await companyLogRepo.insert({ company_id: data.id, action: logAction });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);
    const companyLogRepo = new CompanyLogRepository(db);
    const body = await req.json();
    const { id, ids, updates, logAction } = body;

    if (!updates || (!id && (!Array.isArray(ids) || ids.length === 0))) {
      return NextResponse.json({ error: 'Missing id/ids or updates' }, { status: 400 });
    }

    const data = id
      ? await companyRepo.update(id, updates)
      : await companyRepo.updateMany(ids, updates);

    if (logAction) {
      const companyIds: string[] = id ? [id] : ids;
      await companyLogRepo.insertMany(
        companyIds.map((companyId: string) => ({ company_id: companyId, action: logAction })),
      );
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);
    const dealDocRepo = new DealDocumentRepository(db);
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing company id' }, { status: 400 });
    }

    const filePaths = await dealDocRepo.findFilePathsByDealId(id);
    if (filePaths.length > 0) {
      await db.storage.from('deal-documents').remove(filePaths);
    }

    await companyRepo.delete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
