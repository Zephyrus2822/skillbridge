import { NextRequest, NextResponse } from 'next/server';

const WEAVIATE_URL = process.env.WEAVIATE_URL;
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY;

// Request body interface
interface WeaviateRequestBody {
  userId: string;
  resumeText: string;
}

// Weaviate response interface (adjust based on actual returned fields)
interface WeaviateResponseData {
  id: string;
  class: string;
  properties: {
    userId: string;
    resumeText: string;
  };
  [key: string]: unknown;
}

// Standard error interface
interface ErrorWithMessage extends Error {
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WeaviateRequestBody = await request.json();
    const { userId, resumeText } = body;

    if (!userId || !resumeText) {
      return NextResponse.json({ error: 'Missing userId or resumeText' }, { status: 400 });
    }

    const payload = {
      class: "Resume",
      properties: {
        userId,
        resumeText,
      }
    };

    const weaviateRes = await fetch(`${WEAVIATE_URL}/v1/objects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!weaviateRes.ok) {
      const errorText = await weaviateRes.text();
      return NextResponse.json({ error: errorText }, { status: weaviateRes.status });
    }

    const data: WeaviateResponseData = await weaviateRes.json();
    return NextResponse.json({ success: true, data });

  } catch (error: unknown) {
    const err = error as ErrorWithMessage;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
