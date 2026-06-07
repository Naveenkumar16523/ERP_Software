import os
import redis
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
client = None
is_connected = False

def connect_redis():
    global client, is_connected
    if is_connected:
        return
    try:
        # Validate Redis URL is not a placeholder
        if "your-redis-render-url" in redis_url or "placeholder" in redis_url.lower():
            print(f"Redis connection skipped: REDIS_URL contains placeholder value: {redis_url}")
            print("Set REDIS_URL environment variable to your actual Render Redis instance URL")
            client = None
            is_connected = False
            return

        # Connect using the redis url
        print(f"Attempting to connect to Redis at: {redis_url}")
        client = redis.Redis.from_url(redis_url, socket_connect_timeout=2.0, decode_responses=True)
        # Test connection with a ping
        client.ping()
        is_connected = True
        print("Connected to Redis cache server successfully.")
    except Exception as e:
        print(f"Redis connection failed. Operating with Database-only sessions.")
        print(f"Redis URL used: {redis_url}")
        print(f"Error: {e}")
        client = None
        is_connected = False

def cache_set(key: str, value: str, expiry_seconds: int = None):
    if not is_connected or client is None:
        return
    try:
        if expiry_seconds:
            client.setex(key, expiry_seconds, value)
        else:
            client.set(key, value)
    except Exception as e:
        print(f"Error setting key {key} in Redis: {e}")

def cache_get(key: str) -> str:
    if not is_connected or client is None:
        return None
    try:
        return client.get(key)
    except Exception as e:
        print(f"Error getting key {key} from Redis: {e}")
        return None

def cache_del(key: str):
    if not is_connected or client is None:
        return
    try:
        client.delete(key)
    except Exception as e:
        print(f"Error deleting key {key} in Redis: {e}")
