#!/usr/bin/env python3
"""
Script to update CEO password in PostgreSQL database
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

def update_ceo_password_postgres():
    """Update CEO password in PostgreSQL database"""
    try:
        if CLEAN_DATABASE_URL and "postgresql" in CLEAN_DATABASE_URL:
            engine = create_engine(
                CLEAN_DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600
            )
            
            print("Connected to PostgreSQL database")
            
            # Known bcrypt hash for "admin123"
            known_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYQqL8Yq.6"
            
            with engine.connect() as conn:
                # Update CEO user password
                conn.execute(text("""
                    UPDATE "ERPUser" 
                    SET "passwordHash" = :hash, "isActive" = TRUE, "isCEO" = TRUE
                    WHERE username = 'ceo'
                """), {"hash": known_hash})
                conn.commit()
                
                # Verify the update
                result = conn.execute(text("""
                    SELECT username, "isActive", "isCEO" FROM "ERPUser" WHERE username = 'ceo';
                """))
                user = result.fetchone()
                
                if user:
                    print(f"✓ CEO user updated successfully in PostgreSQL")
                    print(f"  Username: {user[0]}")
                    print(f"  Active: {user[1]}")
                    print(f"  CEO: {user[2]}")
                    print(f"\nLogin with:")
                    print(f"  Username: ceo")
                    print(f"  Password: admin123")
                else:
                    print("✗ CEO user not found in PostgreSQL")
                
            engine.dispose()
        else:
            print("DATABASE_URL not set or not using PostgreSQL")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    update_ceo_password_postgres()
