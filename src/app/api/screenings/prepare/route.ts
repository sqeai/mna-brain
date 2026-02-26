import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { companyIds, criteriaIds } = await req.json();

    if (!Array.isArray(companyIds) || !Array.isArray(criteriaIds)) {
      return NextResponse.json({ error: 'companyIds and criteriaIds are required arrays' }, { status: 400 });
    }

    const entries: Array<{ id: string; company_id: string; criteria_id: string }> = [];

    for (const companyId of companyIds) {
      for (const criteriaId of criteriaIds) {
        const { data: existing } = await supabase
          .from('screenings')
          .select('id, company_id, criteria_id')
          .eq('company_id', companyId)
          .eq('criteria_id', criteriaId)
          .maybeSingle();

        if (existing) {
          const { data: updated, error } = await supabase
            .from('screenings')
            .update({ state: 'pending', result: null, remarks: null })
            .eq('id', existing.id)
            .select('id, company_id, criteria_id')
            .single();
          if (error) throw error;
          entries.push(updated as any);
          continue;
        }

        const { data: inserted, error } = await supabase
          .from('screenings')
          .insert({ company_id: companyId, criteria_id: criteriaId, state: 'pending' })
          .select('id, company_id, criteria_id')
          .single();
        if (error) throw error;
        entries.push(inserted as any);
      }
    }

    return NextResponse.json({ data: entries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to prepare screenings' }, { status: 500 });
  }
}
