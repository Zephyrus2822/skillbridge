import { NextRequest , NextResponse} from "next/server";
import { MongoClient, ObjectId } from "mongodb";    

export async function GET(request: NextRequest, {params}: {params: {resumeId: string}}) {
    const { resumeId } = params;

    if (!resumeId || !ObjectId.isValid(resumeId)) {
        return NextResponse.json({ error: "Invalid or missing resume ID" }, { status: 400 });
    }

    try {
        const uri = process.env.MONGO_URI ?? "";
        if (!uri || typeof uri !== 'string' || !uri.startsWith("mongodb")) {
            console.error('[❌ MONGO ERROR] Invalid or missing MONGO_URI');
            return NextResponse.json({ error: 'MongoDB URI not configured' }, { status: 500 });
        }

        const client = await MongoClient.connect(uri);
        const db = client.db('skillbridge');
        const collection = db.collection('resumes');

        console.log(`[🔍 QUERY] Fetching resume with ID: ${resumeId}`);

        const resume = await collection.findOne({ _id: new ObjectId(resumeId) });

        if (!resume) {
            console.warn(`[⚠️ NOT FOUND] No resume found with ID: ${resumeId}`);
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        console.log(`[✅ FOUND] Resume with ID: ${resumeId} retrieved successfully`);

        return NextResponse.json(resume);
    } catch (err: any) {
        console.error('[❌ DOWNLOAD RESUME API ERROR]', err);
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
    }
}