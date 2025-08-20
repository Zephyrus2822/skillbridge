// src/app/api/rate-feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Define the shape of the request body
interface RateFeedbackRequestBody {
  userId: string;
  resumeText: string;
  feedback: string;
  rating: number; // assuming rating is numeric; change to string if needed
}

// Standard error interface
interface ErrorWithMessage extends Error {
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RateFeedbackRequestBody = await req.json();
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

    const result: { success?: boolean; message?: string } = await response.json();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as ErrorWithMessage;
    console.error('[RATING ERROR]', err.message);
    return NextResponse.json(
      { error: 'Failed to rate feedback', details: err.message },
      { status: 500 }
    );
  }
}
