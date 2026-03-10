import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('favorite_companies')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data: data?.favorite_companies ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { companyId } = await req.json();
    const supabase = createSupabaseClient();

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('favorite_companies')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const current: string[] = (user?.favorite_companies as string[]) ?? [];
    const isFavorited = current.includes(companyId);
    const updated = isFavorited
      ? current.filter((c) => c !== companyId)
      : [...current, companyId];

    const { error: updateError } = await supabase
      .from('users')
      .update({ favorite_companies: updated as any })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
