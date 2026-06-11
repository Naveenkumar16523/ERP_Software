#!/usr/bin/env python3
"""
Script to check SQLite database (erp.db)
"""
import sqlite3

def check_sqlite():
    """Check the SQLite database"""
    try:
        conn = sqlite3.connect('erp.db')
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Tables in SQLite database:")
        print("-" * 40)
        for table in tables:
            print(f"  {table[0]}")
        
        # Check if Account table exists
        if any('Account' in t for t in tables):
            print("\n\nAccount table data:")
            print("-" * 40)
            cursor.execute("SELECT * FROM Account;")
            rows = cursor.fetchall()
            
            if rows:
                # Get column names
                cursor.execute("PRAGMA table_info(Account);")
                columns = [col[1] for col in cursor.fetchall()]
                print(f"Columns: {', '.join(columns)}")
                print(f"\nTotal records: {len(rows)}")
                
                for row in rows:
                    print(f"  {row}")
            else:
                print("No records found")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_sqlite()
