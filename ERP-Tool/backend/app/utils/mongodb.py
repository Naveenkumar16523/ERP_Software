"""
app/utils/mongodb.py — Safe no-op stub.
All MongoDB code has been removed from this project.
This stub exists so any old import (e.g. `from app.utils.mongodb import get_mongo_db`)
does not crash the server at startup.
"""
import logging

logger = logging.getLogger(__name__)


def get_mongo_db():
    """
    No-op stub. Returns None. MongoDB has been removed.
    Any router that still calls this will receive None and should be migrated to SQLAlchemy.
    """
    logger.warning(
        "get_mongo_db() was called but MongoDB has been removed from this project. "
        "Please migrate to SQLAlchemy (app/utils/db.py)."
    )
    return None


# Expose a dummy client object so `from app.utils.mongodb import mongo_client` doesn't crash
class _NoopMongoClient:
    def __getattr__(self, item):
        logger.warning(f"MongoDB is not configured. Attempted access to attribute: {item}")
        return self

    def __call__(self, *args, **kwargs):
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        raise StopAsyncIteration


mongo_client = _NoopMongoClient()
