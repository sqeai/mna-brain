import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const db = createSupabaseClient();
    const { authService } = createContainer(db);
    const data = await authService.signIn(email, password);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    const status = message === 'Invalid email or password' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
