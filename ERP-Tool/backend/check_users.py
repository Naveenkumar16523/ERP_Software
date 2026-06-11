#!/usr/bin/env python3
"""
Script to check users in SQLite database
"""
import sqlite3

def check_users():
    """Check the users in the database"""
    try:
        conn = sqlite3.connect('erp.db')
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%user%';")
        tables = cursor.fetchall()
        
        print("User-related tables:")
        print("-" * 40)
        for table in tables:
            print(f"  {table[0]}")
        
        # Check ERPUser table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ERPUser';")
        if cursor.fetchone():
            print("\n\nERPUser table data:")
            print("-" * 40)
            cursor.execute("PRAGMA table_info(ERPUser);")
            columns = cursor.fetchall()
            print(f"Columns: {[col[1] for col in columns]}")
            
            cursor.execute("SELECT * FROM ERPUser;")
            rows = cursor.fetchall()
            
            if rows:
                print(f"Total users: {len(rows)}")
                for row in rows:
                    print(f"  {row}")
            else:
                print("No users found")
        
        # Check User table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='User';")
        if cursor.fetchone():
            print("\n\nUser table data:")
            print("-" * 40)
            cursor.execute("SELECT id, username, email FROM User;")
            rows = cursor.fetchall()
            
            if rows:
                print(f"Total users: {len(rows)}")
                for row in rows:
                    print(f"  ID: {row[0]}, Username: {row[1]}, Email: {row[2]}")
            else:
                print("No users found")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
