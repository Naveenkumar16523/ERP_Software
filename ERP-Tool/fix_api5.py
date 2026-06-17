import re
file_path = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src\utils\api.js"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace any try { return await request('...'); } catch { return useERPStore.getState().xyz; }
# with return request('...');
text = re.sub(r'try\s*\{\s*return await request\([^)]+\);\s*\}\s*catch(?:\s*\([^)]+\))?\s*\{[^}]*?useERPStore\.getState\(\)[^}]*?\}', 
              lambda m: re.sub(r'try\s*\{\s*return await request\(([^)]+)\);\s*\}.*', r'return request(\1);', m.group(0), flags=re.DOTALL), 
              text, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("api.js patched!")
