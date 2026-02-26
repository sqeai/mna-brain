import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const supabase = createSupabaseClient();

    const normalizedEmail = String(email || '').toLowerCase().trim();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', normalizedEmail)
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sign in failed' }, { status: 500 });
  }
}
