// src/app/api/rate-feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, resumeText, feedback, rating } = body;

    const response = await fetch('http://localhost:8000/api/store-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, resumeText, feedback, rating }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[RATING ERROR]', error.message);
    return NextResponse.json(
      { error: 'Failed to rate feedback', details: error.message },
      { status: 500 }
    );
  }
}
