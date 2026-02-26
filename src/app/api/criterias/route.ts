import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('criterias')
      .select('id, name, prompt')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch criterias' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { name, prompt } = await req.json();

    const { data, error } = await supabase
      .from('criterias')
      .insert({ name, prompt })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create criteria' }, { status: 500 });
  }
}
