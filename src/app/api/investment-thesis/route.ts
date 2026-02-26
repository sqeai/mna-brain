import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await (supabase as any)
      .from('investment_thesis')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ data: data || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch investment thesis' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await req.json();
    const { id, title, content, scan_frequency, sources_count, next_scan_at } = body;

    if (id) {
      const { data, error } = await (supabase as any)
        .from('investment_thesis')
        .update({ title, content, scan_frequency, sources_count })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    const { data, error } = await (supabase as any)
      .from('investment_thesis')
      .insert({
        title: title || 'Default Thesis',
        content,
        scan_frequency,
        sources_count,
        next_scan_at,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save investment thesis' }, { status: 500 });
  }
}
