import logging
from sqlalchemy import text
from app.utils.db import engine

logger = logging.getLogger(__name__)

def run_auto_migrations():
    """
    Automatically adds missing columns to existing tables.
    This is a lightweight alternative to Alembic for development/MVP purposes.
    """
    logger.info("Running automatic schema migrations...")
    
    migrations = [
        # Finance Journal Entries
        "ALTER TABLE finance_journal_entries ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';",
        
        # Finance Invoices
        "ALTER TABLE finance_invoices ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';",
        "ALTER TABLE finance_invoices ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING';",
        "ALTER TABLE finance_invoices ADD COLUMN invoiceDate VARCHAR(50);",
        "ALTER TABLE finance_invoices ADD COLUMN dueDate DATETIME;",
        "ALTER TABLE finance_invoices ADD COLUMN sent BOOLEAN DEFAULT FALSE;",
        
        # HR Employees
        "ALTER TABLE hr_employees ADD COLUMN salary FLOAT;",
        "ALTER TABLE hr_employees ADD COLUMN unpaidLeaveDeductionDays INTEGER DEFAULT 0;",
        
        # CRM Leads
        "ALTER TABLE crm_leads ADD COLUMN expectedRevenue DECIMAL(15, 4) DEFAULT 0.0;",
        
        # Cleanup Sustainability
        "DELETE FROM erp_users WHERE roleId IN (SELECT id FROM erp_roles WHERE departmentId IN (SELECT id FROM erp_departments WHERE name='Sustainability'));",
        "DELETE FROM module_access WHERE roleId IN (SELECT id FROM erp_roles WHERE departmentId IN (SELECT id FROM erp_departments WHERE name='Sustainability'));",
        "DELETE FROM erp_roles WHERE departmentId IN (SELECT id FROM erp_departments WHERE name='Sustainability');",
        "DELETE FROM erp_departments WHERE name='Sustainability';",
        
        # Cleanup duplicate Sales (the one with code SAL)
        "DELETE FROM erp_users WHERE roleId IN (SELECT id FROM erp_roles WHERE departmentId IN (SELECT id FROM erp_departments WHERE name='Sales & Marketing' AND code='SAL'));",
        "DELETE FROM module_access WHERE roleId IN (SELECT id FROM erp_roles WHERE departmentId IN (SELECT id FROM erp_departments WHERE name='Sales & Marketing' AND code='SAL'));",
        "DELETE FROM erp_roles WHERE departmentId IN (SELECT id FROM erp_departments WHERE name='Sales & Marketing' AND code='SAL');",
        "DELETE FROM erp_departments WHERE name='Sales & Marketing' AND code='SAL';"
    ]
    
    with engine.connect() as conn:
        for query in migrations:
            try:
                conn.execute(text(query))
                conn.commit()
                logger.info(f"Successfully ran migration: {query}")
            except Exception as e:
                # If the column already exists, MySQL throws an OperationalError (1060, "Duplicate column name ...")
                # We can safely ignore it.
                if "Duplicate column name" in str(e):
                    logger.debug(f"Column already exists, skipping: {query}")
                else:
                    logger.warning(f"Migration skipped or failed: {query} - {str(e)}")
                    
    logger.info("Automatic schema migrations completed.")
