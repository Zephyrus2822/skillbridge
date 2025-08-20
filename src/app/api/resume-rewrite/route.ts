// File: app/api/rewrite-resume/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Define the shape of the request body
interface RewriteResumeRequestBody {
  userId: string;
  resumeText: string;
  jobDescription?: string;
  // add more fields if your backend expects them
}

// Define the shape of the response (adjust based on backend)
interface RewriteResumeResponse {
  rewrittenResume?: string;
  latexResume?: string;
  [key: string]: unknown; // for any additional fields returned
}

// Standard error interface
interface ErrorWithMessage extends Error {
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RewriteResumeRequestBody = await req.json();

    const response = await fetch('http://localhost:8000/api/rewrite-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data: RewriteResumeResponse = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as ErrorWithMessage;
    console.error('[❌ Rewrite API error]', err.message);
    return NextResponse.json(
      { error: 'Internal rewrite error', details: err.message },
      { status: 500 }
    );
  }
}
