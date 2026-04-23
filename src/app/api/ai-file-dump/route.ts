import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/server/supabase';
import { createContainer } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const { key, fileName, contentType, raw_notes: userRawNotes } = await request.json();

    if (!key || !fileName) {
      return NextResponse.json(
        { error: 'key and fileName are required' },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const { fileService } = createContainer(db);
    const data = await fileService.processUpload(key, fileName, contentType, userRawNotes);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to upload file' },
      { status: 500 },
    );
}
}

export async function GET(request: NextRequest) {
  try {
    const fileType = request.nextUrl.searchParams.get('file_type') ?? undefined;
    const db = createSupabaseClient();
    const { fileService } = createContainer(db);
    const data = await fileService.findAll(fileType);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Fetch files error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch files' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const db = createSupabaseClient();
    const { fileService } = createContainer(db);
    const data = await fileService.update(id, updates);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update file record' },
      { status: 500 },
    );
  }
}
