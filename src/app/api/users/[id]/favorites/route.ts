import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { UserRepository } from '@/lib/repositories';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = createSupabaseClient();
    const userRepo = new UserRepository(db);

    const favorites = await userRepo.findFavoriteCompanies(id);
    return NextResponse.json({ data: favorites });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch favorites';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { companyId } = await req.json();
    const db = createSupabaseClient();
    const userRepo = new UserRepository(db);

    const current = await userRepo.findFavoriteCompanies(id);
    const isFavorited = current.includes(companyId);
    const updated = isFavorited
      ? current.filter((c) => c !== companyId)
      : [...current, companyId];

    await userRepo.update(id, { favorite_companies: updated });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update favorites';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
