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

    try:
        import certifi
        mongo.client = AsyncIOMotorClient(
            mongodb_url, 
            serverSelectionTimeoutMS=5000, 
            tlsAllowInvalidCertificates=True
        )
        # Verify connection by pinging
        await mongo.client.admin.command('ping')
        mongo.is_connected = True
        
        db_name = os.getenv("MONGODB_DB_NAME", "erp_database")
        mongo.db = mongo.client[db_name]
        logger.info(f"Successfully connected to MongoDB Atlas (Database: {db_name})")
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
