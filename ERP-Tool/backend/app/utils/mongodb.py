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
        # Validate MongoDB URI is not localhost (which won't work on Render)
        if "localhost" in MONGODB_URI or "127.0.0.1" in MONGODB_URI:
            print(f"MongoDB connection skipped: MONGODB_URI contains localhost: {MONGODB_URI}")
            print("Set MONGODB_URI environment variable to your MongoDB Atlas connection string")
            print("Format: mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority")
            client = None
            db = None
            is_connected = False
            return

        # Connect using the MongoDB URI
        print(f"Attempting to connect to MongoDB at: {MONGODB_URI.split('@')[1] if '@' in MONGODB_URI else MONGODB_URI}")
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Attempt to get server details to check connection
        await client.server_info()

        # Get the database name from the end of the URI
        db_name = MONGODB_URI.split("/")[-1].split("?")[0] or "erp_logs"
        db = client[db_name]
        is_connected = True
        print("Connected to MongoDB log repository successfully.")
    except Exception as e:
        print(f"MongoDB connection failed. Compliance logs will write to database only.")
        print(f"MongoDB URI used: {MONGODB_URI.split('@')[1] if '@' in MONGODB_URI else MONGODB_URI}")
        print(f"Error: {e}")
        client = None
        db = None
        is_connected = False

def get_mongo_connection_status() -> bool:
    return is_connected

def get_mongo_db():
    return db
