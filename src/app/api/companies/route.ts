import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

function parseBool(value: string | null) {
  return value === 'true' || value === '1';
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const params = req.nextUrl.searchParams;

    const id = params.get('id');
    const stage = params.get('stage');
    const stageIn = params.get('stageIn');
    const excludeStage = params.get('excludeStage');
    const stageNotNull = parseBool(params.get('stageNotNull'));
    const createdAfter = params.get('createdAfter');
    const orderBy = params.get('orderBy') || 'updated_at';
    const orderDir = params.get('orderDir') || 'desc';
    const limit = params.get('limit');
    const countOnly = parseBool(params.get('countOnly'));

    let query = supabase
      .from('companies')
      .select('*', countOnly ? { head: true, count: 'exact' } : undefined);

    if (id) query = query.eq('id', id);
    if (stage) query = query.eq('pipeline_stage', stage);
    if (stageIn) query = query.in('pipeline_stage', stageIn.split(',').filter(Boolean));
    if (excludeStage) query = query.neq('pipeline_stage', excludeStage);
    if (stageNotNull) query = query.not('pipeline_stage', 'is', null);
    if (createdAfter) query = query.gte('created_at', createdAfter);
    if (!countOnly) query = query.order(orderBy as any, { ascending: orderDir === 'asc' });
    if (limit && !countOnly) query = query.limit(Number(limit));

    if (id && !countOnly) {
      const { data, error } = await query.single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    const { data, error, count } = await query;
    if (error) throw error;

    if (countOnly) {
      return NextResponse.json({ data: { count: count || 0 } });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await req.json();
    const { company, logAction } = body;

    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select('*')
      .single();

    if (error) throw error;

    if (logAction) {
      await supabase.from('company_logs').insert({
        company_id: data.id,
        action: logAction,
      });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await req.json();
    const { id, ids, updates, logAction } = body;

    if (!updates || (!id && (!Array.isArray(ids) || ids.length === 0))) {
      return NextResponse.json({ error: 'Missing id/ids or updates' }, { status: 400 });
    }

    let query = supabase.from('companies').update(updates);

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.in('id', ids);
    }

    const { data, error } = await query.select('*');
    if (error) throw error;

    if (logAction) {
      const companyIds = id ? [id] : ids;
      await supabase.from('company_logs').insert(
        companyIds.map((companyId: string) => ({ company_id: companyId, action: logAction }))
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing company id' }, { status: 400 });
    }

    const { data: docs } = await supabase
      .from('deal_documents')
      .select('file_path')
      .eq('deal_id', id);

    const filePaths = (docs || []).map((d: any) => d.file_path).filter(Boolean);
    if (filePaths.length > 0) {
      await supabase.storage.from('deal-documents').remove(filePaths);
    }

    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete company' }, { status: 500 });
  }
}
