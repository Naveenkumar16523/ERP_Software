import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.utils.mongodb import get_mongo_db
from app.utils.db import get_db

@pytest.fixture(scope="function")
def mock_db():
    """Returns a fresh mocked MongoDB for each test."""
    client = AsyncMongoMockClient()
    db = client.test_database
    return db

@pytest.fixture(scope="function")
def client(mock_db):
    """Returns a FastAPI TestClient that uses the mocked database."""
    def override_get_db():
        return mock_db

    app.dependency_overrides[get_mongo_db] = override_get_db
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
        
    # Clear overrides after the test
    app.dependency_overrides.clear()
