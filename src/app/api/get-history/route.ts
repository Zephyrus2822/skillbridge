import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const uri = process.env.MONGO_URI ?? "";

    if (!uri || typeof uri !== 'string' || !uri.startsWith("mongodb")) {
      console.error('[❌ MONGO ERROR] Invalid or missing MONGO_URI');
      return NextResponse.json({ error: 'MongoDB URI not configured' }, { status: 500 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db('skillbridge');
    const collection = db.collection('resumes');

    console.log(`[🔍 QUERY] Searching for resumes of userId: ${userId}`);

    const results = await collection.find({ userId }).sort({ uploadedAt: -1 }).toArray();

    console.log(`[✅ FOUND] ${results.length} resumes for user ${userId}`);

    return NextResponse.json(results);
  } catch (err: any) {
    console.error('[❌ HISTORY API ERROR]', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
