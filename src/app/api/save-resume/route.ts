import { NextRequest, NextResponse } from 'next/server';

const WEAVIATE_URL = process.env.WEAVIATE_URL;
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, resumeText } = body;

    if (!userId || !resumeText) {
      return NextResponse.json({ error: 'Missing userId or resumeText' }, { status: 400 });
    }

   const payload = {
  class: "Resume",
  properties: {
    userId: body.userId,
    resumeText: body.resumeText,
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
      const error = await weaviateRes.text();
      return NextResponse.json({ error }, { status: weaviateRes.status });
    }

    const data = await weaviateRes.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
