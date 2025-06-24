import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI as string;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db('skillbridge');
    const collection = db.collection('resumes');

    const resumes = await collection
      .find({ userId })
      .sort({ uploadedAt: -1 })
      .toArray();

    return NextResponse.json(resumes);
  } catch (error: any) {
    console.error('[HISTORY API ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
