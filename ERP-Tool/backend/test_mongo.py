import asyncio
import os
from dotenv import load_dotenv

async def test():
    load_dotenv()
    print("MONGODB_URL:", os.getenv("MONGODB_URL"))
    
    from app.utils.mongodb import connect_mongodb, mongo
    await connect_mongodb()
    
    if mongo.is_connected:
        print("MongoDB Connected Successfully!")
    else:
        print("Failed to connect.")

if __name__ == "__main__":
    asyncio.run(test())
