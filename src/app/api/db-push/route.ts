import { NextRequest, NextResponse } from 'next/server';

const WEAVIATE_URL = process.env.WEAVIATE_URL;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Example: Push to Weaviate's /v1/objects endpoint
        const weaviateRes = await fetch(`${WEAVIATE_URL}/v1/objects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
