#!/usr/bin/env python3
"""
Script to check chart_of_accounts table in Supabase
"""
import os
from urllib.parse import urlparse, urlunparse
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

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

def check_chart_of_accounts():
    """Query the chart_of_accounts table"""
    try:
        if CLEAN_DATABASE_URL and "postgresql" in CLEAN_DATABASE_URL:
            engine = create_engine(
                CLEAN_DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600
            )
            
            print("Connected to Supabase database")
            print("\nQuerying chart_of_accounts table...\n")
            
            with engine.connect() as conn:
                result = conn.execute(text("SELECT * FROM chart_of_accounts ORDER BY account_code;"))
                
                print(f"{'ID':<38} {'Code':<15} {'Name':<30} {'Type':<15} {'Balance':<15} {'Status':<10}")
                print("-" * 140)
                
                for row in result:
                    print(f"{row[0]:<38} {row[1]:<15} {row[2]:<30} {row[3]:<15} {row[5]:<15} {row[6]:<10}")
                
                print("\n✓ Query completed successfully!")
                
                # Count total records
                count_result = conn.execute(text("SELECT COUNT(*) FROM chart_of_accounts;"))
                count = count_result.scalar()
                print(f"\nTotal records: {count}")
                
            engine.dispose()
        else:
            print("DATABASE_URL not set or not using PostgreSQL")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_chart_of_accounts()
