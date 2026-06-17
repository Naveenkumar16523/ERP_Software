import re

file_path = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src\utils\api.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace:
# try { return await request(...); }
# catch { ... return useERPStore...; }
# With: return request(...);
pattern = re.compile(r"try\s*\{\s*return\s*await\s*request\((.*?)\);\s*\}\s*catch(?:\s*\([^)]*\))?\s*\{\s*.*?useERPStore\.getState\(\).*?\}", re.DOTALL)
content = re.sub(pattern, r"return request(\1);", content)

# Fix custom ones that don't match the simple return await request
pattern2 = re.compile(r"try\s*\{\s*const res = await request\((.*?)\);\s*return res\.entry \|\| res;\s*\}\s*catch(?:\s*\([^)]*\))?\s*\{\s*.*?useERPStore\.getState\(\).*?\}", re.DOTALL)
content = re.sub(pattern2, r"const res = await request(\1);\n        return res.entry || res;", content)

# Remove any remaining catch blocks that just do useERPStore.getState().updateItem...
pattern3 = re.compile(r"try\s*\{\s*return\s*await\s*request\((.*?)\);\s*\}\s*catch(?:\s*\([^)]*\))?\s*\{\s*.*?useERPStore\.getState\(\).*?\}", re.DOTALL)
content = re.sub(pattern3, r"return request(\1);", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("api.js patched via Python.")
