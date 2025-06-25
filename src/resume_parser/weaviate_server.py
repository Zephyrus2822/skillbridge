# weaviate_server.py
import traceback
from fastapi import APIRouter, HTTPException
import os
from dotenv import load_dotenv
from weaviate import connect_to_wcs
from weaviate.auth import AuthApiKey
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from weaviate.collections.classes.filters import Filter
from weaviate.classes.config import Configure, Property, DataType
from weaviate.classes.init import Auth


router = APIRouter()
client = None

 


# ----------------- INIT WEAVIATE CONNECTION -----------------
def init_weaviate_client():
    global client

    load_dotenv()
    WEAVIATE_URL = os.getenv("WEAVIATE_URL")
    WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
    COHERE_KEY = os.getenv("COHERE_APIKEY")
    
    headers = { "X-Cohere-Api-Key": COHERE_KEY,}
    
    if not WEAVIATE_URL or not WEAVIATE_API_KEY:
        raise RuntimeError("Missing Weaviate credentials")
   
    client = connect_to_wcs(
        cluster_url=WEAVIATE_URL,
        auth_credentials=Auth.api_key(WEAVIATE_API_KEY),
        headers=headers
    )

    print("[✅ WEAVIATE] Connected successfully")

    # Init schema
    existing_schemas = client.collections.list_all()  # Returns list of strings

    if "Feedback" not in existing_schemas:
        client.collections.create(
        name="Feedback",
        properties=[
        Property(name="user_id", data_type=DataType.TEXT),
        Property(name="text", data_type=DataType.TEXT),
        Property(name="rating", data_type=DataType.TEXT),
    ],
        vectorizer_config=Configure.Vectorizer.text2vec_cohere(),  # ✅ This is what fixes the vectorization
)
print("[📦 WEAVIATE] 'Feedback' class created with Cohere vectorizer.")

# ----------------- GEMINI AGENT (FOR FEEDBACK) -----------------
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

1. Concise 5-8 points for improvement  
2. Key strengths  
3. Areas for improvement  
4. Recommended roles based on the profile  
5. 2-3 project ideas aligned with current job trends (2024–2025)

Resume:
{resume_text}
"""
    )

    return prompt | llm


# ----------------- VECTOR STORAGE -----------------
def store_feedback_vector(user_id: str, resume_text: str, feedback: str, rating: str = "unrated"):
    if not client:
        print("[⚠️ WEAVIATE] Skipping vector storage — client not initialized")
        return

    combined_text = f"Resume:\n{resume_text}\n\nFeedback:\n{feedback}"
    collection = client.collections.get("Feedback")
    collection.data.insert({
        "user_id": user_id,
        "text": combined_text,
        "rating": rating
    })
    print("[🧠 WEAVIATE] Vector stored.")


# ----------------- RAG RETRIEVAL -----------------
def retrieve_user_feedback(user_id: str, top_k: int = 3) -> list:
    if not client:
        return []

    collection = client.collections.get("Feedback")
    results = collection.query.near_text(
        query="resume improvement",
        filters={"path": ["user_id"], "operator": "Equal", "valueText": user_id},
        limit=top_k
    )

    print(f"[🔍 WEAVIATE] Retrieved {len(results.objects)} past entries")
    return [obj.properties["text"] for obj in results.objects]


# ----------------- FASTAPI ROUTES -----------------
@router.post("/api/get-feedback")
async def generate_feedback(payload: dict):
    resume_text = payload.get("resumeText")
    if not resume_text:
        raise HTTPException(status_code=400, detail="Missing resume text")

    try:
        agent = build_feedback_agent()
        feedback = agent.invoke({"resume_text": resume_text})
        return {"feedback": feedback}
    except Exception as e:
        print(f"[❌ AGENT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail="Agent error")


@router.post("/api/improve-resume")
async def improve_resume(payload: dict):
    user_id = payload.get("userId")
    latest_resume = payload.get("resumeText")

    if not user_id or not latest_resume:
        raise HTTPException(status_code=400, detail="Missing required data")

    try:
        past_contexts = retrieve_user_feedback(user_id)
        joined_context = "\n\n---\n\n".join(past_contexts)

        agent = build_feedback_agent()
        improvement_prompt = PromptTemplate(
            input_variables=["latest_resume", "past_context"],
            template="""
You're a career assistant. Improve the resume using past resume versions and feedback.

### Current Resume:
{latest_resume}

### Past Attempts (Resume + Feedback):
{past_context}

Now generate:
- An improved resume
- 2–3 project ideas relevant to 2024–25 job trends.
"""
        )
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.65,
            convert_system_message_to_human=True,
            google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
        )
        improved_agent = improvement_prompt | llm
        improved_resume = improved_agent.invoke({
            "latest_resume": latest_resume,
            "past_context": joined_context
        })

        return {"improvedResume": improved_resume}
    except Exception as e:
        print(f"[❌ AGENT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail="Resume improvement failed")


@router.post("/api/store-feedback")
async def store_feedback(payload: dict):
    user_id = payload.get("userId", "anonymous")
    resume_text = payload.get("resumeText")
    feedback = payload.get("feedback")
    rating = payload.get("rating", "unrated")

    if not resume_text or not feedback:
        raise HTTPException(status_code=400, detail="Missing data")

    store_feedback_vector(user_id, resume_text, feedback, rating)
    return {"message": "Feedback stored"}


@router.post("/api/rewrite-resume")
async def rewrite_resume(payload: dict):
    user_id = payload.get("userId")
    resume_text = payload.get("resumeText")

    if not resume_text or not user_id:
        raise HTTPException(status_code=400, detail="Missing userId or resumeText")

    try:
        if not client:
            raise RuntimeError("Weaviate client not initialized")

        print(f"[🔁 REWRITE] Fetching vectors for user: {user_id}")
        collection = client.collections.get("Feedback")

        if not collection:
            raise RuntimeError("Feedback class not found in Weaviate")

        # RAG: Search past feedback
        query_result = collection.query.near_text(
            query=f"Resume: {resume_text}",
            filters=Filter.by_property("user_id").equal(user_id),
            limit=3
        )

        if not query_result.objects:
            print("[❗] No similar past feedback found.")
            past_context = "No past feedback found for this user."
        else:
            past_context = "\n\n---\n\n".join([obj.properties["text"] for obj in query_result.objects])

        # Generate rewritten resume
        improvement_prompt = PromptTemplate(
            input_variables=["latest_resume", "past_context"],
            template="""
You're a career assistant. Improve the resume using past resume versions and feedback.

### Current Resume:
{latest_resume}

### Past Attempts (Resume + Feedback):
{past_context}

Now generate:
- An improved resume
- 2–3 project ideas relevant to 2024–25 job trends.
"""
        )
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.65,
            convert_system_message_to_human=True,
            google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
        )
        improved_agent = improvement_prompt | llm
        rewritten = improved_agent.invoke({
            "latest_resume": resume_text,
            "past_context": past_context
        })

        print("[✅ REWRITE DONE]")
        return {"rewritten": rewritten}

    except Exception as e:
        print("[❌ REWRITE ERROR]", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Agent rewrite failed")

