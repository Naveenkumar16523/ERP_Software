import logging
from logging.config import fileConfig
import os
import sys

from alembic import context

# Add backend directory to sys.path so 'app' can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
from app.utils.db import Base
import app.models.sql_models
import app.models.finance_sql_models
import app.models.hr_sql_models
import app.models.payroll_sql_models
import app.models.procurement_sql_models
import app.models.crm_sql_models
import app.models.ecommerce_sql_models
import app.models.supply_chain_sql_models
import app.models.banking_sql_models
import app.models.analytics_sql_models
import app.models.marketing_sql_models
import app.models.security_sql_models
import app.models.assets_sql_models
import app.models.projects_sql_models
import app.models.automation_sql_models
import app.models.support_sql_models
target_metadata = Base.metadata

def get_url():
    url = os.getenv("DATABASE_URL", "sqlite:///./erp.db")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    from sqlalchemy import create_engine
    
    connectable = create_engine(get_url())

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
