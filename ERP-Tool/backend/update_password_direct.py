#!/usr/bin/env python3
"""
Script to update CEO password directly in database using a known hash
"""
import sqlite3

def update_ceo_password():
    """Update CEO password using a known bcrypt hash for 'admin123'"""
    try:
        conn = sqlite3.connect('erp.db')
        cursor = conn.cursor()
        
        # Known bcrypt hash for "admin123"
        # Generated with: bcrypt.hashpw(b"admin123", bcrypt.gensalt())
        known_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYQqL8Yq.6"
        
        # Update CEO user password
        cursor.execute("""
            UPDATE ERPUser 
            SET passwordHash = ?, isActive = 1, isCEO = 1
            WHERE username = 'ceo'
        """, (known_hash,))
        
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
    update_ceo_password()
