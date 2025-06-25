import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, resumeText } = body;

    const response = await fetch("http://0.0.0.0:8000/api/get-feedback", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, resumeText }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error: ${err}`);
    }

    const data = await response.json();

    return NextResponse.json({
      feedback: data.feedback || data.text || "No feedback generated",
    });

  } catch (error: any) {
    console.error('[FEEDBACK ERROR]', error.message);
    return NextResponse.json(
      {
        error: 'Failed to fetch feedback',
        details: error.message,
      },
      {
        status: 501,
      }
    );
  }
}
