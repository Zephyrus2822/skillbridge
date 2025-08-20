import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Interface for the parsed resume response (adjust based on FastAPI response)
interface ParsedResumeResponse {
  parsedText: string;
  [key: string]: unknown;
}

// Standard error interface
interface ErrorWithMessage extends Error {
  message: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('[UPLOAD] File received:', file.name);

    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: 'application/pdf' });

    const form = new FormData();
    form.append('file', blob, file.name);
    form.append('userId', userId);

    const fastapiURL = process.env.FASTAPI_RESUME_PARSER_URL || 'http://127.0.0.1:8000/api/parse-resume';

    if (!fastapiURL) {
      return NextResponse.json({ error: 'FastAPI URL not configured' }, { status: 500 });
    }

    const res = await fetch(fastapiURL, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to parse resume', status: res.status },
        { status: res.status }
      );
    }

    const parsed: ParsedResumeResponse = await res.json();
    return NextResponse.json(parsed);

  } catch (err: unknown) {
    const error = err as ErrorWithMessage;
    console.error('Resume parse error:', error);
    console.error('[UPLOAD] Fetch failed:', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
