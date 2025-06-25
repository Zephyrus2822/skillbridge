import os
from dotenv import load_dotenv
from weaviate import connect_to_wcs
from weaviate.auth import AuthApiKey

load_dotenv()

WEAVIATE_URL = os.getenv("WEAVIATE_URL")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")

if not WEAVIATE_URL or not WEAVIATE_API_KEY:
    raise ValueError("[❌] Missing Weaviate credentials in .env")

# Connect to Weaviate Cloud
client = connect_to_wcs(
    cluster_url=WEAVIATE_URL,
    auth_credentials=AuthApiKey(WEAVIATE_API_KEY),
)

print("[✅] Connected to Weaviate successfully.")

def init_schema():
    schema = client.collections.list_all()
    if "Feedback" not in schema:
        client.collections.create(
            name="Feedback",
            properties=[
                {"name": "user_id", "dataType": "string"},
                {"name": "text", "dataType": "text"},
            ]
        )
        print("[📦] 'Feedback' class created.")
    else:
        print("[ℹ️] 'Feedback' class already exists.")

init_schema()


# Store feedback vector
def store_feedback_vector(user_id: str, resume_text: str, feedback: str):
    combined_text = f"Resume:\n{resume_text}\n\nFeedback:\n{feedback}"
    
    collection = client.collections.get("Feedback")
    collection.data.insert(
        properties={
            "user_id": user_id,
            "text": combined_text
        }
    )
    print("[🧠] Feedback vector stored in Weaviate.")
