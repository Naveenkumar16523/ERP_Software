import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('.env')
db_url = os.getenv('MYSQL_URL')

if db_url and "pymysql" not in db_url:
    db_url = db_url.replace('mysql://', 'mysql+pymysql://')
    
if "?" in db_url:
    db_url = db_url.split("?")[0]

engine = create_engine(db_url, connect_args={'ssl': {'ca': None}})

from app.utils.db import Base
from app.models.finance_sql_models import FinanceAccount

with engine.connect() as conn:
    print("Dropping finance_accounts...")
    conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
    conn.execute(text("DROP TABLE IF EXISTS finance_accounts;"))
    conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
    conn.commit()

print("Recreating finance_accounts...")
Base.metadata.create_all(engine, tables=[FinanceAccount.__table__])
print("Successfully recreated finance_accounts with new columns!")
