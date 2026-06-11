import os
import sys
import psycopg2
from urllib.parse import urlparse, unquote
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
parsed = urlparse(DATABASE_URL)
host = parsed.hostname
port = parsed.port or 5432
dbname = parsed.path.lstrip("/").split("?")[0]
user = unquote(parsed.username)
password = unquote(parsed.password)

try:
    print("Connecting to database to clear all tables...")
    conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password, sslmode="require")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("DROP SCHEMA public CASCADE;")
    cur.execute("CREATE SCHEMA public;")
    cur.execute("GRANT ALL ON SCHEMA public TO postgres;")
    cur.execute("GRANT ALL ON SCHEMA public TO public;")
    print("✅ Database tables successfully dropped and schema recreated.")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
