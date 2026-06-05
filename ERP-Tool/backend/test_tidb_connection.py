#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

db_url = os.getenv('DATABASE_URL')
print(f"Testing connection to: {db_url}")

try:
    engine = create_engine(db_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ TiDB Connection SUCCESSFUL!")
        print(f"Result: {result.fetchone()}")
except Exception as e:
    print(f"❌ TiDB Connection FAILED!")
    print(f"Error: {e}")
