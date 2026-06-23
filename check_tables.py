import pymysql
from urllib.parse import urlparse

# Database connection string from .env.backup
DATABASE_URL = "mysql+pymysql://e2oyFoJyCPHBagf.root:ct3ONCzR5v47GTbR@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/erp_db"

# Parse the connection string
parsed = urlparse(DATABASE_URL.replace("mysql+pymysql://", "mysql://"))

host = parsed.hostname
port = parsed.port
username = parsed.username
password = parsed.password
database = parsed.path.lstrip('/')

print(f"Connecting to database: {database}")
print(f"Host: {host}:{port}")

try:
    connection = pymysql.connect(
        host=host,
        port=port,
        user=username,
        password=password,
        database=database
    )
    
    cursor = connection.cursor()
    
    # Get all tables in the database
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    print(f"\n=== Tables in database '{database}' ===")
    if tables:
        for table in tables:
            print(f"- {table[0]}")
        print(f"\nTotal tables: {len(tables)}")
    else:
        print("No tables found in the database.")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"Error connecting to database: {e}")
