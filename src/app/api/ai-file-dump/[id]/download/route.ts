import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const db = createSupabaseClient();
    const { fileService } = createContainer(db);
    const { downloadUrl } = await fileService.getDownloadUrl(id);

    return NextResponse.json({ success: true, download_url: downloadUrl });
  } catch (error) {
    console.error('Generate download URL error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate download URL' },
      { status: 500 },
    );
  }
}
