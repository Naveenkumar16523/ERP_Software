import os

old_url = "postgresql://postgres:Naveen16523%40%23%24@db.jqzxgtftluqpymkqyiwq.supabase.co:5432/postgres"
new_url = "postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523%40%23%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"

files_to_update = [
    r"C:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\backend\.env",
    r"C:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\backend\write_env.py",
    r"C:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\backend\reset_ceo_password.py",
    r"C:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\ai-services\.env",
    r"C:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\render.yaml",
]

for file_path in files_to_update:
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if old_url in content:
            new_content = content.replace(old_url, new_url)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {file_path}")
        else:
            print(f"URL not found in {file_path}")
    else:
        print(f"File not found: {file_path}")

# Update test_db_connection.py too
test_db_path = r"C:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\backend\test_db_connection.py"
if os.path.exists(test_db_path):
    with open(test_db_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    old_raw = "postgresql://postgres:Naveen16523@#$@db.jqzxgtftluqpymkqyiwq.supabase.co:5432/postgres"
    new_raw = "postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523@#$@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
    
    content = content.replace(old_raw, new_raw)
    content = content.replace(old_url, new_url)
    
    with open(test_db_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {test_db_path}")

