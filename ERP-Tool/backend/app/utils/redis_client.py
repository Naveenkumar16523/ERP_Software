"""
redis_client.py — Redis stub (connection removed)
Exports same interface so auth.py and main.py compile without changes.
"""

is_connected = False

def connect_redis():
    """No-op: Redis has been removed."""
    pass

def cache_set(key: str, value: str, expiry_seconds: int = None):
    pass

def cache_get(key: str) -> str:
    return None

def cache_del(key: str):
    pass
