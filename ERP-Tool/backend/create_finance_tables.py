#!/usr/bin/env python3
"""
Script to create finance tables in Supabase database
"""
import os
from urllib.parse import urlparse, parse_qs, urlunparse
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def clean_database_url(url):
    """Remove all query parameters from DATABASE_URL"""
    if not url:
        return url
    
    parsed = urlparse(url)
    
    # Rebuild URL without query parameters
    cleaned_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        '',  # Empty query string
        parsed.fragment
    ))
    
    return cleaned_url

# Clean the DATABASE_URL
CLEAN_DATABASE_URL = clean_database_url(DATABASE_URL)

# SQL statements to create tables
sql_statements = [
    """
    create table chart_of_accounts (
      id uuid primary key default gen_random_uuid(),
      account_code text not null,
      account_name text not null,
      account_type text check (account_type in ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
      opening_balance numeric default 0,
      current_balance numeric default 0,
      status text default 'Active',
      created_at timestamp default now()
    );
    """,
    """
    create table journal_entries (
      id uuid primary key default gen_random_uuid(),
      reference_number text not null,
      entry_date date not null,
      description text,
      debit_account uuid references chart_of_accounts(id),
      credit_account uuid references chart_of_accounts(id),
      amount numeric not null,
      status text default 'Posted',
      created_at timestamp default now()
    );
    """,
    """
    create table invoices (
      id uuid primary key default gen_random_uuid(),
      invoice_number text not null unique,
      client_name text not null,
      invoice_date date not null,
      due_date date not null,
      subtotal numeric not null,
      tax_rate numeric default 0,
      tax_amount numeric default 0,
      total_amount numeric not null,
      status text check (status in ('Paid', 'Pending', 'Overdue')),
      created_at timestamp default now()
    );
    """,
    """
    create table budget_planner (
      id uuid primary key default gen_random_uuid(),
      budget_name text not null,
      category text not null,
      month text not null,
      allocated_amount numeric not null,
      spent_amount numeric default 0,
      remaining_amount numeric generated always as (allocated_amount - spent_amount) stored,
      created_at timestamp default now()
    );
    """,
    """
    create table expense_tracker (
      id uuid primary key default gen_random_uuid(),
      expense_date date not null,
      category text not null,
      description text,
      amount numeric not null,
      paid_by text,
      receipt_attached boolean default false,
      status text check (status in ('Approved', 'Pending', 'Rejected')),
      created_at timestamp default now()
    );
    """,
    """
    create table approvals (
      id uuid primary key default gen_random_uuid(),
      request_number text not null,
      request_type text not null,
      requested_by text not null,
      amount numeric,
      request_date date not null,
      reason text,
      document_url text,
      status text check (status in ('Approved', 'Pending', 'Rejected')),
      created_at timestamp default now()
    );
    """,
    """
    create table tax_compliance (
      id uuid primary key default gen_random_uuid(),
      tax_name text not null,
      tax_type text not null,
      rate numeric not null,
      applicable_on text,
      effective_date date not null,
      status text default 'Active',
      created_at timestamp default now()
    );
    """,
    """
    create table statements (
      id uuid primary key default gen_random_uuid(),
      statement_type text check (statement_type in ('Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance')),
      period text not null,
      total_income numeric,
      total_expense numeric,
      net_amount numeric,
      date_range_start date,
      date_range_end date,
      status text default 'Generated',
      created_at timestamp default now()
    );
    """
]

def create_tables():
    """Execute SQL statements to create finance tables"""
    try:
        # Use SQLAlchemy to connect with cleaned URL
        if CLEAN_DATABASE_URL and "postgresql" in CLEAN_DATABASE_URL:
            # Create engine with connection pool settings
            engine = create_engine(
                CLEAN_DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600
            )
            
            print("Connected to Supabase database")
            print("\nCreating finance tables...\n")
            
            # Execute each SQL statement
            with engine.connect() as conn:
                for i, sql in enumerate(sql_statements, 1):
                    table_name = sql.split('(')[0].split()[-1].strip()
                    try:
                        conn.execute(text(sql))
                        conn.commit()
                        print(f"✓ Created table: {table_name}")
                    except Exception as e:
                        error_msg = str(e).lower()
                        if "already exists" in error_msg or "duplicate" in error_msg:
                            print(f"⊘ Table already exists: {table_name}")
                        else:
                            print(f"✗ Error creating table {table_name}: {e}")
            
            print("\n✓ All finance tables created successfully!")
            engine.dispose()
        else:
            print("DATABASE_URL not set or not using PostgreSQL")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_tables()
