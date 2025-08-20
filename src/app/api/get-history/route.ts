import { MongoClient, WithId, Document } from 'mongodb';
import { NextResponse } from 'next/server';

// Define the shape of a Resume document
interface Resume extends Document {
  _id: string; // or ObjectId if you want
  userId: string;
  filename: string;
  content: string;
  uploadedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Standard error interface
interface ErrorWithMessage extends Error {
  message: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const uri = process.env.MONGO_URI ?? "";

    if (!uri || !uri.startsWith("mongodb")) {
      console.error('[❌ MONGO ERROR] Invalid or missing MONGO_URI');
      return NextResponse.json({ error: 'MongoDB URI not configured' }, { status: 500 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db('skillbridge');
    const collection = db.collection<Resume>('resumes');

    console.log(`[🔍 QUERY] Searching for resumes of userId: ${userId}`);

    const results: WithId<Resume>[] = await collection.find({ userId }).sort({ uploadedAt: -1 }).toArray();

    console.log(`[✅ FOUND] ${results.length} resumes for user ${userId}`);

    return NextResponse.json(results);
  } catch (err: unknown) {
    const error = err as ErrorWithMessage;
    console.error('[❌ HISTORY API ERROR]', error.message);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
