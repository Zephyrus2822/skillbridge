# weaviate_server.py
import os
import re
import traceback
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests

from weaviate import connect_to_weaviate_cloud as connect_to_wcs
from weaviate.classes.init import Auth
from weaviate.classes.config import Configure, Property, DataType
from weaviate.collections.classes.filters import Filter

from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
load_dotenv() # Loads .env file once for everything

router = APIRouter()
client = None # Initialize Weaviate client as None , this gets updated through backend

# Helper Functions (I am losing my mind its 3.18am here UTC +5.30)
def sanitize_filename(s: str) -> str:
    """
    Replace unsafe filename characters (e.g., /, \, :, *, ?, ", <, >, |, and spaces) with underscores.
    """
    # Replace unsafe characters and whitespace
    return re.sub(r'[\\/*?:"<>| ]', "_", s)

def save_tex_to_file(user_id: str, role: str, tex_content: str) -> str:
    resume_dir = os.getenv("RESUME_OUTPUT_DIR", "Resumes")
    os.makedirs(resume_dir, exist_ok=True)
    safe_role = sanitize_filename(role)
    filename = f"{user_id}_{safe_role.replace(' ', '-')}.tex"
    file_path = os.path.join(resume_dir, filename)

    with open(file_path, "w", encoding="utf-8") as file:
        file.write(tex_content)

    print(f"[✅] LaTeX file saved at: {file_path}")
    return file_path



# Jenkins Pipeline Trigger
class TriggerPayload(BaseModel):
    userId: str
    job_text: str
    mode: str = "latex"
    texContent: str


# ----------------- INIT WEAVIATE CONNECTION -----------------
def init_weaviate_client():
    global client

    
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
            vectorizer_config=Configure.Vectorizer.text2vec_cohere(),  
        )

    if "JobDescription" not in existing_schemas:
        client.collections.create(
            name="JobDescription",
            properties=[
                Property(name="user_id", data_type=DataType.TEXT),
                Property(name="job_text", data_type=DataType.TEXT),
                Property(name="role", data_type=DataType.TEXT),
            ],
            vectorizer_config=Configure.Vectorizer.text2vec_cohere(),
        )
        print("[📄 WEAVIATE] 'JobDescription' class created.")

print("[📦 WEAVIATE] 'Feedback' and 'JobDescripton' class created with Cohere vectorizer.")

# ----------------- GEMINI AGENT (FOR FEEDBACK) -----------------
def build_feedback_agent():
    load_dotenv()
    gemini_key = os.getenv("GOOGLE_GEMINI_API_KEY")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.7,
        convert_system_message_to_human=True,
        google_api_key=gemini_key
    )

    prompt = PromptTemplate(
        input_variables=["resume_text"],
        template="""
You are an expert technical hiring manager, you have a lot of experience in interviewing candidates and understand how the current tech market works, based on that you are to provide feedback. Given the following resume, analyze it and provide:

1. Concise 5-6 points for improvement  
2. Core strengths  
3. Key areas for improvement  
4. Recommended roles based on the profile (simply suggest 2-3 roles compliant with candidate resume).
5. Make improvements on the tech corporate jargon, language used in the resume. The improved resume must not have any copy-pasted segments from previous resume.
6. Make sure that the resume generated here is ATS-friendly and can by-pass AI checks and all the points written in the resume adhere to the Situation-Task-Action-Report + XYZ methodology but do no explicitly mention these terms in the resume, the points themselves should fit the context.
7. Make sure that the resume is long enough to cover ONE A4 PAGE for candidate's experience from 0 years to 5 years.
8. 2-3 project ideas aligned with current job trends (2024-2025)
9. Your output must always be in plain text format. Do not use Markdown but bullet points,italics, headings, or code blocks are allowed. Write clean text lines only, exactly as they should appear in a resume.

Resume:
{resume_text}
"""
    )

    return prompt | llm


# ----------------- VECTOR STORAGE -----------------

GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")
if not GOOGLE_GEMINI_API_KEY: print("[❗] GOOGLE_GEMINI_API_KEY not set. Please set it in your .env file.")
def get_job_role(job_text: str) -> str:
    prompt = PromptTemplate(
        input_variables=["job_text"],
        template="""
        You are a professional job description analyzer. Given the following job description, extract the primary role or position being advertised.
        Job description is given as:
        {job_text}
        """
    )
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.2,
        convert_system_message_to_human=True,
        google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
    )

    agent = prompt | llm
    result = agent.invoke({"job_text": job_text})
    return result.content.strip() if hasattr(result, "content") else str(result)
    
    
    

def store_feedback_vector(user_id: str, resume_text: str, feedback: str, job_text: str, rating: str = "unrated" ):
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
    role = get_job_role(job_text)
    collection = client.collections.get("JobDescription")
    collection.data.insert({
        "user_id": user_id,
        "job_text": job_text,
        "role": role
    })
    print("[📄 JOB] Job description stored.")


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
async def retrieve_user_job_descriptions(user_id: str, top_k: int = 1) -> str:
    try:
        collection = client.collections.get("JobDescription")
        results = collection.query.near_text(
            query="job requirement",
            filters={"path": ["user_id"], "operator": "Equal", "valueText": user_id},
            limit=top_k
        )
        return "\n\n---\n\n".join([obj.properties["job_text"] for obj in results.objects])
    except Exception:
        return ""


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
            input_variables=["latest_resume", "past_context", "job_text"],
            template="""
You're a career assistant. Improve the resume using past resume versions and feedback.

### Current Resume:
{latest_resume}

### Past Attempts (Resume + Feedback):
{past_context}

### Take into consideration the job descriptions provided by the user:
{job_text}

Now generate:
- An improved resume with proper line breaks.
- Do not generate markdown, simple text will do but make it formatted.
- The text resume should have proper emboldening of tech stack names, numbers, etc. and proper italicisation of dates and links. Extract the links from the resume generated and if that is not possible, keep space for them in accurate positions.
- 2-3 project ideas relevant to last 2 year job trends.
"""
        )
        job_collection = client.collections.get("JobDescription")
        job_query = job_collection.query.fetch_objects(
            filters=Filter.by_property("user_id").equal(user_id),
            limit=1
        )
        if job_query.objects:
            job_text = job_query.objects[0].properties["job_text"]
        else:
            job_text = "No job description available."
            
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.65,
            convert_system_message_to_human=True,
            google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
        )
        improved_agent = improvement_prompt | llm
        improved_resume = improved_agent.invoke({
            "latest_resume": latest_resume,
            "past_context": joined_context,
            "job_text": job_text,
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
    job_text = payload.get("job_text")

    if not resume_text or not feedback:
        raise HTTPException(status_code=400, detail="Missing data")

    store_feedback_vector(user_id, resume_text, feedback, job_text, rating)
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

        # Get job description
        job_collection = client.collections.get("JobDescription")
        job_query = job_collection.query.fetch_objects(
            filters=Filter.by_property("user_id").equal(user_id),
            limit=1
        )
        job_text = job_query.objects[0].properties.get("job_text") if job_query.objects else "No job description available."

        # Prompt
        improvement_prompt = PromptTemplate(
    input_variables=["latest_resume", "past_context", "job_text"],
    template="""
You're a career assistant. Improve the resume using past resume versions and feedback.

### Current Resume:
{latest_resume}

### Past Attempts (Resume + Feedback):
{past_context}

### Job Description:
{job_text}

### Instructions:
Provide your output in TWO sections:

---TEXT---
A cleaned, ATS-friendly plain text version of the resume.  
- Use **bold** for tech stacks, numbers, and achievements.  
- Use *italics* for dates and links.  
- Ensure this text is human-readable and fits on ONE A4 page.  
---ENDTEXT---

---LATEX---
A LaTeX formatted version of the improved resume (ready to compile).  
- Use proper LaTeX syntax.  
- Ensure formatting fits one A4 page.  
- Do not leave any placeholder commands unresolved.  
---ENDLATEX---
"""
)


        # Run agent
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.65,
            convert_system_message_to_human=True,
            google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
        )
        improved_agent = improvement_prompt | llm
        result = improved_agent.invoke({
            "latest_resume": resume_text,
            "past_context": past_context,
            "job_text": job_text,
        })

        response_text = result.content if hasattr(result, "content") else str(result)

        # Safe parser
        def extract_section(tag: str) -> str:
            try:
                start = f"---{tag.upper()}---"
                end = f"---END{tag.upper()}---"
                return response_text.split(start)[1].split(end)[0].strip()
            except IndexError:
                print(f"[⚠️ Missing Section] {tag} not found in AI response.")
                return ""

        # now only TEXT section is expected
        text_resume = extract_section("TEXT")

        if not text_resume:
            print("[⚠️ FORMAT WARNING] Resume text is missing.")

        print("[✅ REWRITE DONE]")
        return {
            "text": text_resume
        }

    except Exception as e:
        print("[❌ REWRITE ERROR]", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Agent rewrite failed")



@router.post("/api/store-job-description")
async def store_job_description(payload: dict):
    user_id = payload.get("userId", "anonymous")
    job_text = payload.get("jobText")
 
    if not job_text:
        raise HTTPException(status_code=404, detail="Missing job description")

    try:
        role = get_job_role(job_text)
        collection = client.collections.get("JobDescription")
        collection.data.insert({
            "user_id": user_id,
            "job_text": job_text,
            "role": role
        })
        return {"message": "Job description stored successfully"}
    except Exception as e:
        print("[❌ JOB STORE ERROR]", str(e))
        raise HTTPException(status_code=500, detail="Failed to store job description")
    
@router.post("/api/trigger-publish")
async def trigger_publish(payload: TriggerPayload):
    try:
        # Use default/fallback values if any field is missing
        user_id = payload.userId or "anonymous"
        role = "resume"  # fixed role to ensure Jenkins can always run
        mode = payload.mode or "latex"
        tex_content = payload.texContent or ""

        print(f"🚀 Triggering Jenkins pipeline for user: {user_id}, role: {role}")

        # Jenkins Credentials
        if not all([JENKINS_URL, JENKINS_USER, JENKINS_TOKEN]):
            raise HTTPException(status_code=500, detail="Missing Jenkins credentials or URL in environment.")

        # Jenkins Parameters
        params = {
            "user_id": user_id,
            "role": role,
            "mode": mode,
        }

        res = requests.post(
            JENKINS_URL,
            params=params,
            auth=(JENKINS_USER, JENKINS_TOKEN)
        )

        if res.status_code in [200, 201]:
            print("[✅] Jenkins triggered successfully.")
            # Optionally save LaTeX if provided
            file_path = None
            if tex_content:
                file_path = save_tex_to_file(user_id, role, tex_content)
            return {
                "success": True,
                "message": f"✅ Jenkins pipeline triggered for user `{user_id}` and role `{role}`",
                "file_path": file_path
            }
        else:
            print(f"[❌ Jenkins Error] Status: {res.status_code} - {res.text}")
            raise HTTPException(status_code=500, detail=f"Jenkins error: {res.text}")

    except Exception as e:
        print(f"[❌ PIPELINE TRIGGER ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger Jenkins pipeline: {str(e)}")



@router.get("/get-resume")
def get_resume(resume_id: str):
    file_path = f"/path/to/resumes/{resume_id}.tex"
    return FileResponse(path=file_path, media_type='application/x-tex')   

@router.post("/api/compile-latex")
async def save_tex(payload: dict):
    user_id = payload.get("userId", "anonymous")
    role = payload.get("role")
    tex_content = payload.get("texContent")
    # job_text = payload.get("jobText", "")

    if not user_id or not role or not tex_content:
        raise HTTPException(status_code=400, detail="Missing userId, role, or texContent in payload")

    try:
        resume_dir = os.getenv("RESUME_OUTPUT_DIR", "Resumes")
        os.makedirs(resume_dir, exist_ok=True)
        safe_role = sanitize_filename(role)
        filename = f"{user_id}_{safe_role.replace(' ', '-')}.tex"
        file_path = os.path.join(resume_dir, filename)
        print("[DEBUG] Final file path:", file_path)
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(tex_content)

        print(f"[✅] LaTeX file saved at: {file_path}")
        return {"message": "LateX file saved successfully", "file_path": file_path}

    except Exception as e:
        print(f"[❌] Error saving LaTeX file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save LaTeX file")

    
@router.get("/api/get-role/{user_id}")
async def get_role(user_id: str):
    try:
        collection = client.collections.get("JobDescription")
        results = collection.query.fetch_objects(
            filters=Filter.by_property("user_id").equal(user_id),
            limit=1
        )

        if not results or not results.objects:
            raise HTTPException(status_code=404, detail="No job description found for this user")

        job_text = results.objects[0].properties.get("job_text")
        if not job_text:
            raise HTTPException(status_code=404, detail="Job description is empty")

        role = get_job_role(job_text)
        return {"role": role}

    except Exception as e:
        print(f"[❌] Error fetching role: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user role")
