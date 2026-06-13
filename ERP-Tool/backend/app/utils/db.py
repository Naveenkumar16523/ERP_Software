import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "FATAL: DATABASE_URL environment variable is not set. "
        "Set it to your Supabase direct connection URL: "
        "postgresql://postgres.<project>:<password>@db.<project>.supabase.co:5432/postgres"
    )

if "supabase" not in DATABASE_URL and "supabase.co" not in DATABASE_URL and "supabase.com" not in DATABASE_URL:
    print(f"[WARNING] DATABASE_URL does not appear to point to Supabase: {DATABASE_URL[:50]}...")

# Use SSL for Supabase, plain for local dev
connect_args = {}
if "supabase.co" in DATABASE_URL or "supabase.com" in DATABASE_URL:
    connect_args = {
        "sslmode": "require",
        "connect_timeout": 15,  # Render cold starts can take 5-15s
    }

try:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=5,
        max_overflow=10,
    )
    # Verify connection on startup
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"[DB] Connected to Supabase successfully.")
except Exception as e:
    raise RuntimeError(
        f"FATAL: Cannot connect to Supabase database.\n"
        f"URL: {DATABASE_URL[:60]}...\n"
        f"Error: {e}\n\n"
        f"Troubleshooting:\n"
        f"  1. Ensure DATABASE_URL uses port 5432 (Session pooler or Direct)\n"
        f"  2. URL format: postgresql://postgres.<ref>:<password>@aws-0-...pooler.supabase.com:5432/postgres\n"
        f"  3. Check Supabase project is not paused\n"
        f"  4. Verify password is URL-encoded (@ → %40, # → %23, $ → %24)\n"
    ) from e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
