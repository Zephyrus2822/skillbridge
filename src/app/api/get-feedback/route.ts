import { NextRequest, NextResponse } from "next/server";

// Define the shape of the request body
interface FeedbackRequestBody {
  userId: string;
  resumeText: string;
  feedback?: string;
  timestamp?: string;
}

// Define a standard error shape
interface ErrorWithMessage extends Error {
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequestBody = await request.json();
    const { userId, resumeText, feedback, timestamp } = body;

    const response = await fetch("http://localhost:8000/api/get-feedback", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, resumeText, feedback, timestamp }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error: ${err}`);
    }

    const data: { feedback?: string; text?: string } = await response.json();

    return NextResponse.json({
      feedback: data.feedback || data.text || "No feedback generated",
    });

  } catch (error: unknown) {
    const err = error as ErrorWithMessage;
    console.error('[FEEDBACK ERROR]', err.message);
    return NextResponse.json(
      {
        error: 'Failed to fetch feedback',
        details: err.message,
      },
      {
        status: 501,
      }
    );
  }
}
