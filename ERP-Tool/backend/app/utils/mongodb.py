"""
mongodb.py — MongoDB connection using Motor
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

class MongoDBClient:
    client: AsyncIOMotorClient = None
    db = None
    is_connected = False

mongo = MongoDBClient()

async def connect_mongodb():
    """Initialize MongoDB connection."""
    mongodb_url = os.getenv("MONGODB_URL")
    if not mongodb_url:
        logger.warning("MONGODB_URL is not set in environment. MongoDB will not connect.")
        return
        
    mongodb_url = mongodb_url.strip('"').strip("'")

    try:
        import certifi
        mongo.client = AsyncIOMotorClient(
            mongodb_url, 
            serverSelectionTimeoutMS=5000, 
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True
        )
        # Verify connection by pinging
        await mongo.client.admin.command('ping')
        mongo.is_connected = True
        
        db_name = os.getenv("MONGODB_DB_NAME", "erp_database")
        mongo.db = mongo.client[db_name]
        logger.info(f"Successfully connected to MongoDB Atlas (Database: {db_name})")
        await create_indexes()
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        mongo.is_connected = False
        mongo.client = None
        mongo.db = None

async def close_mongodb():
    """Close MongoDB connection."""
    if mongo.client:
        mongo.client.close()
        mongo.is_connected = False
        logger.info("MongoDB connection closed.")

def get_mongo_connection_status() -> bool:
    return mongo.is_connected

def get_mongo_db():
    return mongo.db

async def create_indexes():
    if mongo.db is not None:
        await mongo.db.erp_users.create_index("email", unique=True)
        await mongo.db.erp_users.create_index("username", unique=True)
        await mongo.db.audit_logs.create_index("timestamp")
        await mongo.db.audit_logs.create_index("userId")
        await mongo.db.accounts.create_index("code", unique=True)
        await mongo.db.refresh_tokens.create_index("token", unique=True)
        await mongo.db.refresh_tokens.create_index("expiresAt", expireAfterSeconds=0)
