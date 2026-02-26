import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseClient();

    const filesQuery = supabase
      .from('files')
      .select('id, file_name, file_link, file_date, created_at')
      .filter('matched_companies', 'cs', JSON.stringify([{ id }]))
      .order('created_at', { ascending: false })
      .limit(100);

    const [logsRes, notesRes, linksRes, docsRes, screeningsRes, filesRes] = await Promise.all([
      supabase.from('company_logs').select('id, action, created_at').eq('company_id', id).order('created_at', { ascending: true }),
      supabase.from('deal_notes').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
      supabase.from('deal_links').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
      supabase.from('deal_documents').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
      supabase
        .from('screenings')
        .select(`
          *,
          criterias (
            id,
            name,
            prompt
          )
        `)
        .eq('company_id', id)
        .order('created_at', { ascending: false }),
      filesQuery,
    ]);

    return NextResponse.json({
      data: {
        logs: logsRes.data || [],
        notes: notesRes.data || [],
        links: linksRes.data || [],
        documents: docsRes.data || [],
        screenings: screeningsRes.data || [],
        matchedFiles: filesRes.data || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch details' }, { status: 500 });
  }
}
