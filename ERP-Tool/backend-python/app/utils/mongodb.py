import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/erp_logs")
client = None
db = None
is_connected = False

async def connect_mongodb():
    global client, db, is_connected
    if is_connected:
        return
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Attempt to get server details to check connection
        await client.server_info()
        
        # Get the database name from the end of the URI
        db_name = MONGODB_URI.split("/")[-1].split("?")[0] or "erp_logs"
        db = client[db_name]
        is_connected = True
        print("🔌 Connected to MongoDB log repository successfully.")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed. Compliance logs will write to database only. Error: {e}")
        client = None
        db = None
        is_connected = False

def get_mongo_connection_status() -> bool:
    return is_connected

def get_mongo_db():
    return db