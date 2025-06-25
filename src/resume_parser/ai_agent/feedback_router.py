from fastapi import APIRouter, HTTPException
from ..agent import build_feedback_agent
from .vector_store import store_feedback_vector

router = APIRouter()

@router.post("/api/get-feedback")
async def generate_feedback(payload: dict):
    resume_text = payload.get("resumeText")
    user_id = payload.get("userId")

    print(f"[📨] Feedback request received for user: {user_id}")

    if not resume_text:
        print("[❌] Missing resume text in request payload.")
        raise HTTPException(status_code=400, detail="Resume text is required.")

    try:
        print("[🤖] Invoking feedback agent...")
        agent = build_feedback_agent()
        feedback = agent.run(resume_text)
        print("[✅] Feedback generated.")

        print("[📥] Storing feedback vector to Weaviate...")
        store_feedback_vector(user_id, resume_text, feedback)
        print("[✅] Vector stored successfully.")
        print("[📩] Received resume text:")
        print(resume_text[:100])  # log first 500 chars only


        return {"feedback": feedback}

    except Exception as e:
        print(f"[❌] Feedback generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate feedback.")
