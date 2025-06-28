from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime
from bson import ObjectId, Binary
from io import BytesIO
import fitz  # PyMuPDF
import spacy
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from weaviate_server import init_weaviate_client
from weaviate_server import router as feedback_router
from global_state import GlobalState  # we'll create this file

# === App Init ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

# === Startup Hook ===
@app.on_event("startup")
def init_services():
    load_dotenv()
    print("[DEBUG] RESUME_OUTPUT_DIR:", os.getenv("RESUME_OUTPUT_DIR"))


    # Mongo setup
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise RuntimeError("[❌] MONGO_URI missing")
    mongo_client = MongoClient(mongo_uri)
    mongo_client.admin.command("ping")
    db = mongo_client["skillbridge"]
    print("[✅ MONGO] Connected to MongoDB")

    # NLP setup
    nlp_model = spacy.load("en_core_web_sm")
    print("[✅ NLP] spaCy loaded")

    # Store global
    GlobalState.mongo_client = mongo_client
    GlobalState.db = db
    GlobalState.collection = db["resumes"]
    GlobalState.nlp = nlp_model

    # Try Weaviate init
    try:
        init_weaviate_client()
    except Exception as e:
        print(f"[⚠️ WEAVIATE] Failed to initialize Weaviate: {e}")

# === Routes ===
@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...), userId: str = Form(...)):
    print(f"[📄] Upload received: {file.filename}")
    content = await file.read()

    text = extract_text(content)
    doc = GlobalState.nlp(text)
    skills = [ent.text for ent in doc.ents if ent.label_ in ['SKILL', 'ORG', 'PERSON']]
    summary = text[:]

    resume_doc = {
        "userId": userId,
        "filename": file.filename,
        "file_data": Binary(content),
        "parsedText": text,
        "summary": summary,
        "skills": list(set(skills)),
        "uploadedAt": datetime.now()
    }

    print(f"[📥 MONGO] Saving resume for user {userId}")
    GlobalState.collection.insert_one(resume_doc)

    return {
        "filename": file.filename,
        "summary": summary,
        "skills": list(set(skills))
    }

@app.get("/api/download-resume/{resume_id}")
def download_resume(resume_id: str):
    doc = GlobalState.collection.find_one({"_id": ObjectId(resume_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")

    return StreamingResponse(BytesIO(doc["file_data"]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={doc['filename']}"}
    )

def extract_text(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "".join([page.get_text() for page in doc])

# === Weaviate Router ===
app.include_router(feedback_router)
