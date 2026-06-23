import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

raw_url = os.getenv("MYSQL_URL") or os.getenv("DB_URL")
MYSQL_URL = None

if raw_url:
    # SQLAlchemy requires the driver to be specified (pymysql)
    if raw_url.startswith("mysql://"):
        MYSQL_URL = raw_url.replace("mysql://", "mysql+pymysql://", 1)
    else:
        MYSQL_URL = raw_url
    
    # pymysql doesn't support 'ssl-mode' in the query string
    if "?ssl-mode=" in MYSQL_URL:
        MYSQL_URL = MYSQL_URL.split("?ssl-mode=")[0]

engine = None
SessionLocal = None
Base = declarative_base()

if MYSQL_URL:
    try:
        # Aiven requires SSL, so we pass ssl={"ca": None} to use system certs
        engine = create_engine(
            MYSQL_URL,
            connect_args={"ssl": {"ca": None}},
            pool_pre_ping=True
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("SQLAlchemy engine initialized for Aiven MySQL.")
    except Exception as e:
        logger.error(f"Failed to initialize SQLAlchemy engine: {e}")
else:
    logger.warning("MYSQL_URL not found in environment. Database will not connect.")

def get_db():
    if SessionLocal is None:
        logger.error("SessionLocal is None. Database is not configured.")
        yield None
        return
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    if engine is None:
        return False
    try:
        with engine.connect() as connection:
            return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
