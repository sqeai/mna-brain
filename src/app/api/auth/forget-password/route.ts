import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/server/db';
import { createContainer } from '@/lib/services';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const db = createDb();
    const { authService } = createContainer(db);
    const key = await authService.forgetPassword(email);
    return NextResponse.json({ key });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate reset token';
    const status = message === 'Email not found' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
