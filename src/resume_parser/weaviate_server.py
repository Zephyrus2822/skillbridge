# weaviate_server.py

from fastapi import APIRouter, HTTPException
import os
from dotenv import load_dotenv
from weaviate import connect_to_wcs
from weaviate.auth import AuthApiKey
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from langchain_google_genai import ChatGoogleGenerativeAI

router = APIRouter()
client = None

# ----------------- INIT WEAVIATE CONNECTION -----------------
def init_weaviate_client():
    global client

    load_dotenv()
    WEAVIATE_URL = os.getenv("WEAVIATE_URL")
    WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")

    if not WEAVIATE_URL or not WEAVIATE_API_KEY:
        raise RuntimeError("Missing Weaviate credentials")

    client = connect_to_wcs(
        cluster_url=WEAVIATE_URL,
        auth_credentials=AuthApiKey(WEAVIATE_API_KEY),
    )

    print("[✅ WEAVIATE] Connected successfully")

    # Init schema
    schema = client.collections.list_all()
    if "Feedback" not in schema:
        client.collections.create(
            name="Feedback",
            properties=[
                {"name": "user_id", "dataType": "string"},
                {"name": "text", "dataType": "text"}
            ]
        )
        print("[📦 WEAVIATE] 'Feedback' class created.")
    else:
        print("[ℹ️ WEAVIATE] 'Feedback' class already exists.")


# ----------------- GEMINI AGENT (from test_agent.py) -----------------
def build_feedback_agent():
    load_dotenv()
    gemini_key = os.getenv("GOOGLE_GEMINI_API_KEY")

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.7,
        convert_system_message_to_human=True,
        google_api_key=gemini_key
    )

    prompt = PromptTemplate(
        input_variables=["resume_text"],
        template="""
You are an expert hiring manager. Given the following resume, analyze it and provide:

1. A brief summary  
2. Key strengths  
3. Areas for improvement  
4. Recommended roles based on the candidate's profile  

Resume:
{resume_text}
"""
    )

    return prompt | llm  # RunnableSequence


# ----------------- VECTOR STORAGE -----------------
def store_feedback_vector(user_id: str, resume_text: str, feedback: str):
    if not client:
        print("[⚠️ WEAVIATE] Skipping vector storage — client not initialized")
        return

    combined_text = f"Resume:\n{resume_text}\n\nFeedback:\n{feedback}"
    collection = client.collections.get("Feedback")
    collection.data.insert({
        "user_id": user_id,
        "text": combined_text
    })
    print("[🧠 WEAVIATE] Vector stored.")


# ----------------- FASTAPI ROUTE -----------------
@router.post("/api/get-feedback")
async def generate_feedback(payload: dict):
    resume_text = payload.get("resumeText")
    user_id = payload.get("userId")

    if not resume_text:
        raise HTTPException(status_code=400, detail="Missing resume text")

    try:
        print("[🤖 AGENT] Generating feedback")
        agent = build_feedback_agent()
        feedback = agent.invoke({"resume_text": resume_text})  # invoke preferred

        print("[✅ AGENT] Feedback generated successfully.")
        store_feedback_vector(user_id, resume_text, feedback)

        return {"feedback": feedback}
    except Exception as e:
        print(f"[❌] Feedback generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Agent error")
