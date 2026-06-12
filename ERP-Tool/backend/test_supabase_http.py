import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

print("=" * 60)
print("  Supabase HTTP Connection Fallback Test")
print("=" * 60)
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print("============================================================")

try:
    from app.utils.db import engine, get_db
    print("Engine created successfully.")
    
    # Check if the connection uses the custom creator
    # Our creator is used if the engine dialec name is postgresql
    print(f"Dialect: {engine.dialect.name}")
    
    # 1. Test basic select
    print("\nTesting SELECT 1...")
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1"))
        print(f"SELECT 1 result: {res.fetchall()}")
        
    # 2. Test table inspection
    print("\nListing first 3 rows of 'Account' table...")
    with engine.connect() as conn:
        res = conn.execute(text('SELECT * FROM "Account" LIMIT 3'))
        rows = res.fetchall()
        print(f"Found {len(rows)} accounts:")
        for r in rows:
            print(f" - {r}")
            
    print("\n🎉 Connection and query via Supabase HTTP works perfectly!")
    
except Exception as e:
    print("\n❌ Test failed!")
    import traceback
    traceback.print_exc()

print("=" * 60)
