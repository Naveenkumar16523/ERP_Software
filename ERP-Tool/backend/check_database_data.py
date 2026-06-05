#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

load_dotenv()

db_url = os.getenv('DATABASE_URL')
print(f"Checking database: {db_url}")

try:
    engine = create_engine(db_url)
    
    # Check if tables exist
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n📊 Tables in database: {len(tables)}")
    for table in tables:
        print(f"  - {table}")
    
    # Check row counts for each table
    print(f"\n📈 Row counts:")
    with engine.connect() as connection:
        for table in tables:
            try:
                result = connection.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                print(f"  - {table}: {count} rows")
            except Exception as e:
                print(f"  - {table}: Error - {e}")
    
    print(f"\n✅ Database check complete")
    
except Exception as e:
    print(f"❌ Error checking database: {e}")
