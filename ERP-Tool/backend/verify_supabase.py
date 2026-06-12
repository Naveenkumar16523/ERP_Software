#!/usr/bin/env python3
"""
verify_supabase.py
──────────────────
Quick diagnostic: tests whether the backend can reach Supabase.
Run from:  ERP-Tool/backend/
"""
import os, sys, socket
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv

load_dotenv()

RAW_URL = os.getenv("DATABASE_URL", "")

def clean(url):
    p = urlparse(url)
    return urlunparse((p.scheme, p.netloc, p.path, p.params, "", p.fragment))

DB_URL = clean(RAW_URL)

print("=" * 60)
print("  Supabase Connection Diagnostic")
print("=" * 60)

if not DB_URL:
    print("❌  DATABASE_URL is NOT set in .env — nothing to connect to.")
    sys.exit(1)

parsed = urlparse(DB_URL)
host   = parsed.hostname
port   = parsed.port or 5432

print(f"  Host : {host}")
print(f"  Port : {port}")
print(f"  DB   : {parsed.path.lstrip('/')}")
print(f"  User : {parsed.username}")
print()

# ── Step 1: TCP reachability ─────────────────────────────────────────────────
print("Step 1 — TCP reachability check …")
try:
    sock = socket.create_connection((host, port), timeout=6)
    sock.close()
    print(f"  ✅  Port {port} on {host} is reachable.\n")
    tcp_ok = True
except Exception as e:
    print(f"  ❌  Cannot reach {host}:{port}  →  {e}")
    print(f"\n  🔧  Try port 5432 (direct) instead of 6543 (pooler) in your .env:\n")
    print(f"      DATABASE_URL=postgresql://postgres:<password>@db.{parsed.hostname.split('pooler.')[1] if 'pooler.' in (parsed.hostname or '') else parsed.hostname}:5432/postgres")
    tcp_ok = False

# ── Step 2: SQLAlchemy connection ────────────────────────────────────────────
print("Step 2 — SQLAlchemy + psycopg2 connection …")
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(
        DB_URL,
        connect_args={"sslmode": "require", "connect_timeout": 8},
        pool_pre_ping=True,
    )
    with engine.connect() as conn:
        result = conn.execute(text("SELECT current_database(), version()"))
        db_name, version = result.fetchone()
    engine.dispose()
    print(f"  ✅  Connected!  DB={db_name}")
    print(f"  PG  version: {version[:60]} …")
    print()
    print("  🎉  Your backend WILL write data to Supabase — not SQLite.")
    print("      Restart the backend server and try submitting a form again.")
    conn_ok = True
except Exception as e:
    print(f"  ❌  SQLAlchemy connection failed:")
    print(f"      {e}")
    conn_ok = False

# ── Step 3: Try without SSL as fallback hint ─────────────────────────────────
if not conn_ok:
    print()
    print("Step 3 — Retry without sslmode=require …")
    try:
        from sqlalchemy import create_engine, text
        engine2 = create_engine(
            DB_URL,
            connect_args={"connect_timeout": 8},
            pool_pre_ping=True,
        )
        with engine2.connect() as conn2:
            conn2.execute(text("SELECT 1"))
        engine2.dispose()
        print("  ✅  Connected WITHOUT sslmode=require.")
        print("  ℹ️   Update connect_args in db.py to remove sslmode:require for this host.")
    except Exception as e2:
        print(f"  ❌  Still failed: {e2}")
        if not tcp_ok:
            print()
            print("  ⚠️   The most likely cause is that your ISP/router is BLOCKING")
            print(f"      port {port}. Try changing DATABASE_URL to use port 5432.")

print()
print("=" * 60)
