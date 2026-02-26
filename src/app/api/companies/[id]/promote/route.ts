import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { currentStage, nextStage, note, linkUrl, linkTitle } = await req.json();
    const supabase = createSupabaseClient();

    const { error } = await supabase
      .from('companies')
      .update({ pipeline_stage: nextStage })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('company_logs').insert({
      company_id: id,
      action: currentStage ? `PROMOTED_FROM_${currentStage}_TO_${nextStage}` : `PROMOTED_TO_${nextStage}`,
    });

    if (note?.trim()) {
      await supabase.from('deal_notes').insert({
        deal_id: id,
        content: note,
        stage: currentStage || 'L0',
      });
    }

    if (linkUrl?.trim()) {
      await supabase.from('deal_links').insert({
        deal_id: id,
        url: linkUrl,
        title: linkTitle || null,
        stage: currentStage || 'L0',
      });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to promote company' }, { status: 500 });
  }
}
