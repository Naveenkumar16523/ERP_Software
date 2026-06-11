#!/usr/bin/env python3
"""
Script to test inserting data into chart_of_accounts table
"""
import os
from urllib.parse import urlparse, urlunparse
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def clean_database_url(url):
    """Remove all query parameters from DATABASE_URL"""
    if not url:
        return url
    
    parsed = urlparse(url)
    
    # Rebuild URL without query parameters
    cleaned_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        '',  # Empty query string
        parsed.fragment
    ))
    
    return cleaned_url

# Clean the DATABASE_URL
CLEAN_DATABASE_URL = clean_database_url(DATABASE_URL)

def test_insert():
    """Test inserting a record into chart_of_accounts"""
    try:
        if CLEAN_DATABASE_URL and "postgresql" in CLEAN_DATABASE_URL:
            engine = create_engine(
                CLEAN_DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600
            )
            
            print("Connected to Supabase database")
            print("\nTesting insert into chart_of_accounts...\n")
            
            with engine.connect() as conn:
                # First, check current table structure
                print("Checking table structure...")
                schema_result = conn.execute(text("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'chart_of_accounts'
                    ORDER BY ordinal_position;
                """))
                
                print("\nTable schema:")
                print("-" * 50)
                for row in schema_result:
                    print(f"{row[0]:<30} {row[1]:<20}")
                
                # Count current records
                count_result = conn.execute(text("SELECT COUNT(*) FROM chart_of_accounts;"))
                count_before = count_result.scalar()
                print(f"\nRecords before insert: {count_before}")
                
                # Insert a test record
                test_id = str(uuid.uuid4())
                print(f"\nInserting test record with ID: {test_id}")
                
                insert_sql = text("""
                    INSERT INTO chart_of_accounts 
                    (id, account_code, account_name, account_type, opening_balance, current_balance, status, created_at)
                    VALUES 
                    (:id, :account_code, :account_name, :account_type, :opening_balance, :current_balance, :status, NOW())
                """)
                
                conn.execute(insert_sql, {
                    "id": test_id,
                    "account_code": "TEST-001",
                    "account_name": "Test Account",
                    "account_type": "Asset",
                    "opening_balance": 1000.0,
                    "current_balance": 1000.0,
                    "status": "Active"
                })
                conn.commit()
                
                # Count records after insert
                count_result = conn.execute(text("SELECT COUNT(*) FROM chart_of_accounts;"))
                count_after = count_result.scalar()
                print(f"Records after insert: {count_after}")
                
                # Query the inserted record
                print("\nQuerying inserted record...")
                result = conn.execute(text("SELECT * FROM chart_of_accounts WHERE id = :id"), {"id": test_id})
                
                for row in result:
                    print(f"ID: {row[0]}")
                    print(f"Account Code: {row[1]}")
                    print(f"Account Name: {row[2]}")
                    print(f"Account Type: {row[3]}")
                    print(f"Opening Balance: {row[4]}")
                    print(f"Current Balance: {row[5]}")
                    print(f"Status: {row[6]}")
                    print(f"Created At: {row[7]}")
                
                # Clean up - delete the test record
                print("\nCleaning up test record...")
                conn.execute(text("DELETE FROM chart_of_accounts WHERE id = :id"), {"id": test_id})
                conn.commit()
                
                print("✓ Test completed successfully!")
                
            engine.dispose()
        else:
            print("DATABASE_URL not set or not using PostgreSQL")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_insert()
