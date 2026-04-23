import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/server/db';
import { createContainer } from '@/lib/services';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const db = createDb();
    const { authService } = createContainer(db);
    const data = await authService.signIn(email, password);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    const status = message === 'Invalid email or password' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
