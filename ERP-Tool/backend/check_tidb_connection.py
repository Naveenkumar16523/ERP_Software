"""
Check TiDB Cloud connection status
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

print("=" * 60)
print("TiDB Cloud Connection Status Check")
print("=" * 60)
print()

# Check DATABASE_URL
database_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL environment variable: {'SET' if database_url else 'NOT SET'}")

if database_url:
    print(f"Database URL: {database_url}")
    
    # Check if it's TiDB Cloud
    if "tidbcloud.com" in database_url:
        print("✓ Detected TiDB Cloud connection string")
    else:
        print("✗ Not a TiDB Cloud connection string")
else:
    print("✗ DATABASE_URL not configured")
    print("Current fallback: SQLite (erp.db)")

print()
print("-" * 60)
print("Testing Connection...")
print("-" * 60)

if database_url and "tidbcloud.com" in database_url:
    try:
        # Configure SSL for TiDB Cloud
        connect_args = {"ssl": {}}
        
        engine = create_engine(
            database_url,
            echo=False,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Successfully connected to TiDB Cloud!")
            print(f"✓ Connection string: {database_url}")
            
            # Get database info
            try:
                db_info = conn.execute(text("SELECT VERSION()"))
                version = db_info.fetchone()
                print(f"✓ Database version: {version[0] if version else 'Unknown'}")
            except:
                pass
                
    except Exception as e:
        print(f"✗ Failed to connect to TiDB Cloud")
        print(f"✗ Error: {str(e)}")
        print()
        print("Current status: Using SQLite fallback (erp.db)")
else:
    print("✗ TiDB Cloud not configured")
    print("Current status: Using SQLite fallback (erp.db)")

print()
print("=" * 60)
print("Configuration Instructions")
print("=" * 60)
print()
print("To connect to TiDB Cloud:")
print("1. Set DATABASE_URL in backend/.env file:")
print("   DATABASE_URL=mysql+pymysql://user:password@host:4000/database")
print()
print("2. Example format:")
print("   DATABASE_URL=mysql+pymysql://root:password@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/erp_db")
print()
print("3. Restart the backend server after changing .env")
print()
