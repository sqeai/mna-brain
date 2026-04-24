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
    if (message === 'Invalid email or password') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    // Never return raw SQL / params (may include the password) to the client.
    console.error('[auth/sign-in]', error);
    return NextResponse.json(
      { error: 'Sign in temporarily unavailable. Check server logs or database access for this app user.' },
      { status: 500 },
    );
  }
}
