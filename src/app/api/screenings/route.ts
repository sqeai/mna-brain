import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const params = req.nextUrl.searchParams;
    const companyId = params.get('companyId');
    const onlyL0 = params.get('onlyL0') === 'true';

    let query = supabase
      .from('screenings')
      .select(`
        id,
        company_id,
        criteria_id,
        state,
        result,
        remarks,
        created_at,
        updated_at,
        company:companies(target, pipeline_stage),
        criterias(id, name, prompt)
      `)
      .order('created_at', { ascending: false });

    if (companyId) query = query.eq('company_id', companyId);

    const { data, error } = await query;
    if (error) throw error;

    const transformed = (data || []).filter((row: any) => !onlyL0 || row.company?.pipeline_stage === 'L0');

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch screenings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('screenings')
      .insert(body)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create screening' }, { status: 500 });
  }
}
