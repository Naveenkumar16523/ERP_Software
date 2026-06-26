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

# Import Base
from app.utils.db import Base

# Import ALL models so they get registered with Base.metadata
import app.models.sql_models
import app.models.finance_sql_models
import app.models.hr_sql_models
import app.models.crm_sql_models
import app.models.payroll_sql_models
import app.models.procurement_sql_models
import app.models.supply_chain_sql_models
import app.models.banking_sql_models
import app.models.analytics_sql_models
import app.models.assets_sql_models
import app.models.automation_sql_models
import app.models.marketing_sql_models
import app.models.projects_sql_models
import app.models.security_sql_models
import app.models.support_sql_models

print("Recreating ALL tables for all modules...")
Base.metadata.create_all(engine)
print("All tables successfully created in the database!")
