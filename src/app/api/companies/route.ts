import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

function parseBool(value: string | null) {
  return value === 'true' || value === '1';
}

export async function GET(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const { companyService } = createContainer(db);
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
      const count = await companyService.count({ id, stage, stageIn, excludeStage, stageNotNull, createdAfter });
      return NextResponse.json({ data: { count } });
    }

    if (id) {
      const data = await companyService.findById(id);
      return NextResponse.json({ data });
    }

    const data = await companyService.list({ stage, stageIn, excludeStage, stageNotNull, createdAfter, orderBy, orderDir, limit });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch companies';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const { companyService } = createContainer(db);
    const { company, logAction } = await req.json();
    const data = await companyService.create(company, logAction);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = createSupabaseClient();
    const { companyService } = createContainer(db);
    const { id, ids, updates, logAction } = await req.json();

    if (!updates || (!id && (!Array.isArray(ids) || ids.length === 0))) {
      return NextResponse.json({ error: 'Missing id/ids or updates' }, { status: 400 });
    }

    const data = id
      ? await companyService.update(id, updates, logAction)
      : await companyService.updateMany(ids, updates, logAction);

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing company id' }, { status: 400 });

    const db = createSupabaseClient();
    const { companyService } = createContainer(db);
    await companyService.delete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
