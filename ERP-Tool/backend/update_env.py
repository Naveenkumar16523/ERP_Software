#!/usr/bin/env python3
"""
Script to update .env file with clean DATABASE_URL (without query parameters)
"""
from urllib.parse import urlparse, urlunparse

# Original DATABASE_URL with query parameters
original_url = 'postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523%40%23%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'

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
cleaned_url = clean_database_url(original_url)

# Read existing .env file and update DATABASE_URL
try:
    with open('.env', 'r') as f:
        lines = f.readlines()
    
    # Update DATABASE_URL line
    updated_lines = []
    for line in lines:
        if line.startswith('DATABASE_URL='):
            updated_lines.append(f'DATABASE_URL={cleaned_url}\n')
        else:
            updated_lines.append(line)
    
    # Write back to .env
    with open('.env', 'w') as f:
        f.writelines(updated_lines)
    
    print('.env file updated successfully')
    print(f'Cleaned DATABASE_URL: {cleaned_url}')
except Exception as e:
    print(f'Error updating .env file: {e}')
