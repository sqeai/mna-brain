import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { url, title, stage } = await req.json();
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('deal_links')
      .insert({ deal_id: id, url, title: title || null, stage: stage || 'L0' })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add link' }, { status: 500 });
  }
}
