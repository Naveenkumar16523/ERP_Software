import logging
from app.utils.mongodb import get_mongo_db

logger = logging.getLogger(__name__)

# Mock class so any legacy imports of Base don't instantly crash
class DummyBase:
    metadata = type('DummyMetadata', (), {'create_all': lambda *args, **kwargs: None})()

Base = DummyBase()
engine = None
SessionLocal = None

def get_db():
    """
    Returns the MongoDB database instance instead of a SQLAlchemy session.
    All routers using Depends(get_db) will receive a MongoDB db.
    """
    db = get_mongo_db()
    if db is None:
        logger.error("MongoDB is not connected. get_db() returned None.")
    yield db

def test_connection():
    """
    Dummy test connection function to replace SQLAlchemy connection test.
    """
    from app.utils.mongodb import get_mongo_connection_status
    return get_mongo_connection_status()
