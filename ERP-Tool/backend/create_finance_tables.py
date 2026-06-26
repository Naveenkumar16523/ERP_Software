import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv('.env')
db_url = os.getenv('MYSQL_URL')

if db_url and "pymysql" not in db_url:
    db_url = db_url.replace('mysql://', 'mysql+pymysql://')
    
if "?" in db_url:
    db_url = db_url.split("?")[0]

engine = create_engine(db_url, connect_args={'ssl': {'ca': None}})

# Import Base and only the Finance models
from app.utils.db import Base
from app.models.finance_sql_models import (
    FinanceAccount,
    JournalEntry,
    Invoice,
    Budget,
    Expense,
    ApprovalWorkflow,
    ApprovalLevel,
    TaxDeadline,
    Statement,
    FinanceAuditLog
)

tables_to_create = [
    FinanceAccount.__table__,
    JournalEntry.__table__,
    Invoice.__table__,
    Budget.__table__,
    Expense.__table__,
    ApprovalWorkflow.__table__,
    ApprovalLevel.__table__,
    TaxDeadline.__table__,
    Statement.__table__,
    FinanceAuditLog.__table__
]

print("Creating the following tables:")
for t in tables_to_create:
    print(t.name)

Base.metadata.create_all(engine, tables=tables_to_create)
print("Tables created successfully!")
