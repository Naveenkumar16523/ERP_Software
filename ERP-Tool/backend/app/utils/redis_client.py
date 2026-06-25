"""
redis_client.py — In-memory stub
Simulates a Redis cache for KPI and analytics caching.
"""
import time

is_connected = True
_cache = {}

def connect_redis():
    """Simulated connection."""
    pass

def cache_set(key: str, value: str, expiry_seconds: int = None):
    expires_at = time.time() + expiry_seconds if expiry_seconds else None
    _cache[key] = {"value": value, "expires_at": expires_at}

def cache_get(key: str) -> str:
    if key in _cache:
        item = _cache[key]
        if item["expires_at"] and time.time() > item["expires_at"]:
            del _cache[key]
            return None
        return item["value"]
    return None

def cache_del(key: str):
    if key in _cache:
        del _cache[key]
