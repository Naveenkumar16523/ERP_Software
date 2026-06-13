import sqlalchemy
print(sqlalchemy.__version__)

import psycopg2
print(psycopg2.__version__)

from sqlalchemy import create_engine, text

urls = [
    # 1. Direct URL (IPv6 only usually)
    "postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523%40%23%24@db.jqzxgtftluqpymkqyiwq.supabase.co:5432/postgres",
    # 2. Transaction Pooler (port 6543)
    "postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523%40%23%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
    # 3. Session Pooler (port 5432)
    "postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523%40%23%24@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
]

for url in urls:
    print(f"\nTesting: {url.split('@')[1]}")
    try:
        engine = create_engine(url, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1")).scalar()
            print("SUCCESS! Result:", res)
    except Exception as e:
        print("FAILED:", str(e).split('\n')[0])
