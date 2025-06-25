import os
import weaviate
from weaviate.classes.init import Auth
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

# Best practice: store your credentials in environment variables
WEAVIATE_URL = os.getenv("WEAVIATE_URL")  # e.g., "https://your-cluster.weaviate.network"
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")

# Connect to Weaviate Cloud
client = weaviate.connect_to_weaviate_cloud(
    cluster_url=WEAVIATE_URL,
    auth_credentials=Auth.api_key(WEAVIATE_API_KEY),
)

print(client.is_ready())
client.close()