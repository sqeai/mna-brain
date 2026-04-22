import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { UserRepository } from '@/lib/repositories';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const db = createSupabaseClient();
    const userRepo = new UserRepository(db);

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = await userRepo.findByEmailAndPassword(email, hashedPassword);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    return NextResponse.json({ data: user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
