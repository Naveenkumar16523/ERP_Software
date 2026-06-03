import os
import json

path = r'c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\backend\app\seed.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read().strip()

# Decode content
if content.startswith('"') or content.startswith("'"):
    try:
        content = json.loads(content)
    except:
        content = content[1:-1].replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\').replace("\\'", "'").replace('\\"', '"')

# Search for assignments
out_path = r'c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\credentials.txt'
with open(out_path, 'w', encoding='utf-8') as out:
    out.write("--- SEED CONTENT PARSING ---\n")
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if any(term in line.lower() for term in ['user', 'email', 'password', 'admin', 'role', '@']):
            out.write(f"L{i}: {line}\n")
    out.write("\n--- FULL CONTENT ---\n")
    out.write(content)

print("Credentials extracted successfully to credentials.txt")
