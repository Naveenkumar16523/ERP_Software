"""
db.py — Database stub (all database connections removed)
SQLAlchemy models and get_db() are preserved as no-ops so routers compile without changes.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

# In-memory SQLite — purely so SQLAlchemy Base/engine/SessionLocal exist as valid objects.
# No data is persisted. All routes will work without any external database.
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
