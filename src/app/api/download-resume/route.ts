import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId, WithId, Document } from "mongodb";

// Define the Resume type (extend as per your schema)
interface Resume extends Document {
  _id: ObjectId;
  userId: string;
  filename: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define error shape
interface ApiError {
  error: string;
  details?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  const { resumeId } = params;

  if (!resumeId || !ObjectId.isValid(resumeId)) {
    const errorResponse: ApiError = { error: "Invalid or missing resume ID" };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  try {
    const uri = process.env.MONGO_URI ?? "";
    if (!uri || typeof uri !== "string" || !uri.startsWith("mongodb")) {
      console.error("[❌ MONGO ERROR] Invalid or missing MONGO_URI");
      const errorResponse: ApiError = { error: "MongoDB URI not configured" };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db("skillbridge");
    const collection = db.collection<Resume>("resumes");

    console.log(`[🔍 QUERY] Fetching resume with ID: ${resumeId}`);

    const resume: WithId<Resume> | null = await collection.findOne({
      _id: new ObjectId(resumeId),
    });

    if (!resume) {
      console.warn(`[⚠️ NOT FOUND] No resume found with ID: ${resumeId}`);
      const errorResponse: ApiError = { error: "Resume not found" };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    console.log(`[✅ FOUND] Resume with ID: ${resumeId} retrieved successfully`);

    return NextResponse.json(resume);
  } catch (err: unknown) {
    console.error("[❌ DOWNLOAD RESUME API ERROR]", err);

    const errorResponse: ApiError = {
      error: "Internal server error",
      details: err instanceof Error ? err.message : String(err),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
