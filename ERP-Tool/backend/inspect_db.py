import os
import sys
import socket
from sqlalchemy import create_engine, text, inspect

# Set a default socket timeout to prevent hanging DNS lookups
socket.setdefaulttimeout(3.0)

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env manually to avoid hanging module imports
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

output = []
output.append(f"DATABASE_URL resolved to: {DATABASE_URL}")

# Try connecting to PostgreSQL first with a strict 3s timeout
engine = None
if DATABASE_URL and "postgresql" in DATABASE_URL:
    try:
        from urllib.parse import urlparse
        parsed_url = urlparse(DATABASE_URL)
        hostname = parsed_url.hostname
        output.append(f"Resolving host {hostname}...")
        # Verify host resolves (will respect socket default timeout of 3s)
        ip = socket.gethostbyname(hostname)
        output.append(f"Host resolved to {ip}")
        
        output.append("Attempting to connect to PostgreSQL with 3s timeout...")
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        output.append("PostgreSQL connected successfully!")
    except Exception as e:
        output.append(f"PostgreSQL connection failed or host not reachable: {e}. Falling back to SQLite.")
        engine = None

if engine is None:
    output.append("Connecting to fallback SQLite erp.db...")
    engine = create_engine("sqlite:///./erp.db", connect_args={"check_same_thread": False})

try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1"))
        output.append(f"Test query SELECT 1 returned: {res.fetchone()}")
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        output.append(f"\n📊 Tables in database: {len(tables)}")
        
        for table in tables:
            try:
                row_count_res = conn.execute(text(f"SELECT COUNT(*) FROM \"{table}\""))
                row_count = row_count_res.fetchone()[0]
                output.append(f"  - {table}: {row_count} rows")
            except Exception as e:
                try:
                    row_count_res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    row_count = row_count_res.fetchone()[0]
                    output.append(f"  - {table}: {row_count} rows")
                except Exception as e2:
                    output.append(f"  - {table}: Error checking count: {e2}")
except Exception as e:
    output.append(f"Error checking tables: {e}")

# Save to absolute path
status_file_path = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\backend\db_status.txt"
with open(status_file_path, "w", encoding="utf-8") as f:
    f.write("\n".join(output))
print("Done!")
