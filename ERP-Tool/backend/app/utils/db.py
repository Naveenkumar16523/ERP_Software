import os
from urllib.parse import urlparse, urlunparse
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load env variables
load_dotenv()

def clean_database_url(url):
    """Remove all query parameters from DATABASE_URL"""
    if not url:
        return url
    
    parsed = urlparse(url)
    
    # Rebuild URL without query parameters
    cleaned_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        '',  # Empty query string
        parsed.fragment
    ))
    
    return cleaned_url

DATABASE_URL = clean_database_url(os.getenv("DATABASE_URL"))
IS_DEV = os.getenv("NODE_ENV", "development") == "development"

# Configure connection arguments, enabling SSL for TiDB Cloud and PostgreSQL
connect_args = {}
if DATABASE_URL and "tidbcloud.com" in DATABASE_URL:
    connect_args = {
        "ssl": {
            # TiDB Cloud requires SSL/TLS. PyMySQL ssl options can be set to an empty dict to activate SSL.
            # "strict" or cert dict can also be passed depending on needs.
        }
    }

# Use SQLite as fallback if DATABASE_URL is not set or connection fails
if not DATABASE_URL:
    print("DATABASE_URL not set. Using SQLite as fallback database.")
    DATABASE_URL = "sqlite:///./erp.db"
    connect_args = {}

try:
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Set to True if database query logging is needed in terminal
        connect_args=connect_args,
        pool_pre_ping=True,  # Test connections before handing them to handlers to avoid stale connection errors
        pool_recycle=3600    # Recycle connections after an hour
    )
    # Test connection
    with engine.connect() as conn:
        conn.execute("SELECT 1")
    print(f"Connected to database successfully: {DATABASE_URL}")
except Exception as e:
    print(f"Failed to connect to {DATABASE_URL}. Falling back to SQLite.")
    DATABASE_URL = "sqlite:///./erp.db"
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
        pool_recycle=3600
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
