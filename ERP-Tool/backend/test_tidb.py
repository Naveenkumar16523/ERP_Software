import pymysql
import sys

host = "gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com"
port = 4000
user = "99VoygpLvkoT1Et.root"
password = "IHclgIYvskJe3nFH"

try:
    print(f"Connecting to TiDB at {host}...")
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        ssl_verify_cert=True,
        ssl_verify_identity=True
    )
    
    with conn.cursor() as cursor:
        cursor.execute("SHOW DATABASES;")
        databases = [row[0] for row in cursor.fetchall()]
        print("Successfully connected!")
        print("Available databases:")
        for db in databases:
            print(f" - {db}")
            
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
