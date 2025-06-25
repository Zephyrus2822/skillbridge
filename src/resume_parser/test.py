import weaviate
from weaviate.connect import ConnectionParams
from weaviate.auth import AuthApiKey
import os
from dotenv import load_dotenv

load_dotenv()

WEAVIATE_URL = os.getenv("WEAVIATE_URL")  # e.g., "https://your-cluster.weaviate.network"
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")

# ✅ Specify both URL and gRPC port (usually 50051 unless Weaviate says otherwise)
connection_params = ConnectionParams.from_url(
    url=WEAVIATE_URL,
    grpc_port=50051  # ← this is the missing piece
)

auth = AuthApiKey(WEAVIATE_API_KEY)

client = weaviate.WeaviateClient(
    connection_params=connection_params,
    auth_credentials=auth
)

if client.is_ready():
    print("[✅] Connected to Weaviate v4 successfully.")
else:
    print("[❌] Failed to connect to Weaviate.")
