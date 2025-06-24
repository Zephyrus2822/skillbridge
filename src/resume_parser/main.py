from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from datetime import datetime
from fastapi.responses import StreamingResponse
from io import BytesIO
import fitz  # PyMuPDF
import spacy
import os
from dotenv import load_dotenv
# Start server using uvicorn main:app --host 0.0.0.0 --port 8000 --reload

load_dotenv()  # Load MONGO_URI from .env

# Init
app = FastAPI()
nlp = spacy.load("en_core_web_sm")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URI = os.getenv("MONGO_URI")  # <- Make sure .env has this
client = MongoClient(MONGO_URI)

try:
    client.admin.command('ping')
    print("[✅ MONGODB] Connected to MongoDB Atlas successfully.")
except Exception as e:
    print("[❌ MONGODB] Connection failed:", e)


db = client["skillbridge"]
collection = db["resumes"]

@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...), userId: str = Form(...)):
    print(f"[RESUME] Received: {file.filename}")
    content = await file.read()
    print("[RESUME] File read successfully")

    text = extract_text(content)
    print("[RESUME] Text extracted")

    doc = nlp(text)
    print("[RESUME] NLP processed")

    skills = [ent.text for ent in doc.ents if ent.label_ in ['SKILL', 'ORG', 'PERSON']]
    summary = text[:1000]

    # Insert into MongoDB
    collection.insert_one({
        "userId": userId,
        "filename": file.filename,
        "parsedText": text,
        "summary": summary,
        "skills": list(set(skills)),
        "uploadedAt": datetime.utcnow()
    })

    return {
        "filename": file.filename,
        "summary": summary,
        "skills": list(set(skills))
    }

@app.get("/api/download-resume/{resume_id}")
def download_resume(resume_id: str):
    doc = collection.find_one({"_id": ObjectId(resume_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    file_data = doc["file_data"]  # binary
    filename = doc["filename"]

    return StreamingResponse(BytesIO(file_data), media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename={filename}"
    })

def extract_text(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text
