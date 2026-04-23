import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/server/db';
import { createContainer } from '@/lib/services';

export async function POST(req: NextRequest) {
  try {
    const db = createDb();
    const { screeningService } = createContainer(db);
    const { companyIds, criteriaIds } = await req.json();

    if (!Array.isArray(companyIds) || !Array.isArray(criteriaIds)) {
      return NextResponse.json(
        { error: 'companyIds and criteriaIds are required arrays' },
        { status: 400 },
      );
    }

    const data = await screeningService.prepare(companyIds, criteriaIds);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to prepare screenings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
