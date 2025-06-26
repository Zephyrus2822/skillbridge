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
5. Make improvements on the corporate jargon, language used in the resume. The improved resume must not have any copy-pasted segments from previous resume.
6. Make sure that the resume generated here is ATS-friendly and can by-pass AI checks.
7. Make sure that the resume is long enough to cover ONE A4 PAGE for candidate's experience from 0 years to 5 years.
8. 2-3 project ideas aligned with current job trends (2024-2025)

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
        You are a job description analyzer. Given the following job description, extract the primary role or position being advertised.
        Job description is given as:
        {job_text}
        """
    )
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
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
- An improved resume
- 2–3 project ideas relevant to 2024–25 job trends.
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
            model="gemini-1.5-flash",
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

        # Generate rewritten resume
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

### Instructions:
1. Analyze the current resume and past feedback.
2. Identify the core strengths for the candidate that he can show off to the recruiters.
3. Make improvements on the corporate jargon, language used in the resume. The improved resume must not have any copy-pasted segments from previous resume.
4. Make sure that the resume generated here is ATS-friendly and can by-pass AI checks.
5. Make sure that the resume is long enough to cover ONE A4 PAGE for candidate's experience from 0 years to 5 years.
6. Make sure that the generated resume follows the following format: (.md format for easy accessibility and Replace all placeholder variables (indicated by {{variable_name}}) with appropriate content based on the provided information.)
    {{FULL_NAME}}
{{STREET_ADDRESS}}, {{CITY}}, {{STATE}} {{ZIP_CODE}}
📞 {{PHONE_NUMBER}}
✉️ {{EMAIL_ADDRESS}}
🔗 {{LINKEDIN_URL}}
💻 {{GITHUB_URL}}
Education
{{UNIVERSITY_NAME}}
{{START_DATE}} -- {{END_DATE}}
{{UNIVERSITY_CITY}}, {{UNIVERSITY_STATE}}
{{DEGREE_TYPE}} in {{MAJOR}}
Relevant Coursework
{{COURSE_1}}, {{COURSE_2}}, {{COURSE_3}}, {{COURSE_4}}, {{COURSE_5}}, {{COURSE_6}}, {{COURSE_7}}, {{COURSE_8}}
Experience
{{COMPANY_1_NAME}}
{{POSITION_1_START_DATE}} -- {{POSITION_1_END_DATE}}
{{JOB_TITLE_1}}
{{COMPANY_1_CITY}}, {{COMPANY_1_STATE}}

{{ACHIEVEMENT_1_1}}
{{ACHIEVEMENT_1_2}}
{{ACHIEVEMENT_1_3}}
{{ACHIEVEMENT_1_4}}

{{COMPANY_2_NAME}}
{{POSITION_2_START_DATE}} -- {{POSITION_2_END_DATE}}
{{JOB_TITLE_2}}
{{COMPANY_2_CITY}}, {{COMPANY_2_STATE}}

{{ACHIEVEMENT_2_1}}
{{ACHIEVEMENT_2_2}}
{{ACHIEVEMENT_2_3}}
{{ACHIEVEMENT_2_4}}

Projects
{{PROJECT_1_NAME}} | {{PROJECT_1_TECHNOLOGIES}}
{{PROJECT_1_DATE}}

{{PROJECT_1_DESCRIPTION_1}}
{{PROJECT_1_DESCRIPTION_2}}
{{PROJECT_1_DESCRIPTION_3}}
{{PROJECT_1_DESCRIPTION_4}}

{{PROJECT_2_NAME}} | {{PROJECT_2_TECHNOLOGIES}}
{{PROJECT_2_DATE}}

{{PROJECT_2_DESCRIPTION_1}}
{{PROJECT_2_DESCRIPTION_2}}
{{PROJECT_2_DESCRIPTION_3}}

{{PROJECT_3_NAME}} | {{PROJECT_3_TECHNOLOGIES}}
{{PROJECT_3_DATE}}

{{PROJECT_3_DESCRIPTION_1}}
{{PROJECT_3_DESCRIPTION_2}}
{{PROJECT_3_DESCRIPTION_3}}

Technical Skills
Languages: {{PROGRAMMING_LANGUAGES}}
Developer Tools: {{DEVELOPMENT_TOOLS}}
Technologies/Frameworks: {{TECHNOLOGIES_FRAMEWORKS}}
Leadership / Extracurricular
{{ORGANIZATION_NAME}}
{{LEADERSHIP_START_DATE}} -- {{LEADERSHIP_END_DATE}}
{{LEADERSHIP_POSITION}}
{{ORGANIZATION_LOCATION}}

{{LEADERSHIP_ACHIEVEMENT_1}}
{{LEADERSHIP_ACHIEVEMENT_2}}
{{LEADERSHIP_ACHIEVEMENT_3}}
7. Do not include any information that is not present in current resume. If there is not enough information in current resume, keep certain fields blank.
8. Make sure to put as much skill names in the rewritten resume as possible that matches exactly with the job description provided.
   For example, if the job description mentions Backend Development or similar, make sure to include that in rewritten resume and also mention relevant skills in the skills section.
   Do this MANDATORILY for all the skills mentioned in the job description.


Now generate:
- An improved resume
- 2-3 project ideas relevant to 2024-25 job trends.
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
            model="gemini-1.5-flash",
            temperature=0.65,
            convert_system_message_to_human=True,
            google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY")
        )
        improved_agent = improvement_prompt | llm
        rewritten = improved_agent.invoke({
            "latest_resume": resume_text,
            "past_context": past_context,
            "job_text": job_text,
        })

        print("[✅ REWRITE DONE]")
        return {"rewritten": rewritten}

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
