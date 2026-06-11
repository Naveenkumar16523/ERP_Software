#!/usr/bin/env python3
"""
Script to test different PostgreSQL connection methods
"""
import os
from urllib.parse import urlparse, urlunparse, unquote
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

def test_connection(url, description):
    """Test a database connection"""
    print(f"\nTesting: {description}")
    print(f"URL: {url}")
    
    try:
        engine = create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"connect_timeout": 10}
        )
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Connection successful!")
            engine.dispose()
            return True
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False

if __name__ == "__main__":
    original_url = DATABASE_URL
    cleaned_url = clean_database_url(original_url)
    
    # Parse the URL to get components
    parsed = urlparse(cleaned_url)
    
    # Try different connection methods
    print("=" * 60)
    print("Testing PostgreSQL connection methods")
    print("=" * 60)
    
    # Method 1: Original cleaned URL
    test_connection(cleaned_url, "Method 1: Cleaned URL")
    
    # Method 2: With SSL mode require
    url_ssl = f"{cleaned_url}?sslmode=require"
    test_connection(url_ssl, "Method 2: With sslmode=require")
    
    # Method 3: With pooler disabled (use direct connection)
    # Change pooler.supabase.com to db.supabase.com
    url_direct = cleaned_url.replace("pooler.supabase.com", "db.supabase.com")
    test_connection(url_direct, "Method 3: Direct connection (db.supabase.com)")
    
    # Method 4: Direct connection with SSL
    url_direct_ssl = f"{url_direct}?sslmode=require"
    test_connection(url_direct_ssl, "Method 4: Direct connection with SSL")
    
    print("\n" + "=" * 60)
    print("Testing complete")
    print("=" * 60)
