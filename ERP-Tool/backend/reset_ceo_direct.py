#!/usr/bin/env python3
"""
Script to reset CEO password directly in database
"""
import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_ceo_password():
    """Reset CEO password to admin123"""
    try:
        conn = sqlite3.connect('erp.db')
        cursor = conn.cursor()
        
        # Hash the new password
        new_hash = pwd_context.hash("admin123")
        
        # Update CEO user password
        cursor.execute("""
            UPDATE ERPUser 
            SET passwordHash = ?, isActive = 1, isCEO = 1
            WHERE username = 'ceo'
        """, (new_hash,))
        
        conn.commit()
        
        # Verify the update
        cursor.execute("SELECT username, isActive, isCEO FROM ERPUser WHERE username = 'ceo';")
        user = cursor.fetchone()
        
        if user:
            print(f"✓ CEO user updated successfully")
            print(f"  Username: {user[0]}")
            print(f"  Active: {user[1]}")
            print(f"  CEO: {user[2]}")
            print(f"\nLogin with:")
            print(f"  Username: ceo")
            print(f"  Password: admin123")
        else:
            print("✗ CEO user not found")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_ceo_password()
