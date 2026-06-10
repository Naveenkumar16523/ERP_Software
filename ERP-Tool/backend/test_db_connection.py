#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# Direct connection strings
raw_url = "postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523@#$@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
encoded_url = f"postgresql://postgres.jqzxgtftluqpymkqyiwq:{quote_plus('Naveen16523@#$')}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"

print("--- Testing Raw Password URL ---")
try:
    print(f"URL: {raw_url}")
    engine = create_engine(raw_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Raw URL Connection SUCCESSFUL!")
        print(f"Result: {result.fetchone()}")
except Exception as e:
    print(f"❌ Raw URL Connection FAILED!")
    print(f"Error: {e}")

print("\n--- Testing Encoded Password URL ---")
try:
    print(f"URL: {encoded_url}")
    engine = create_engine(encoded_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Encoded URL Connection SUCCESSFUL!")
        print(f"Result: {result.fetchone()}")
except Exception as e:
    print(f"❌ Encoded URL Connection FAILED!")
    print(f"Error: {e}")
