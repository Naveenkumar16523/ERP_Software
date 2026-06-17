import re

file_path = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src\utils\api.js"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Pass 1: Remove catch blocks that contain useERPStore
# E.g. catch { return useERPStore.getState().accounts; }
# or catch (e) { ... useERPStore ... }
text = re.sub(r"catch\s*(?:\([^)]*\))?\s*\{[^{]*?useERPStore[^{]*?\}", "", text)

# Pass 2: Now we have orphaned try { ... } 
# Let's clean up try { return await request(...) } -> return request(...)
text = re.sub(r"try\s*\{\s*(return await request\([^)]+\);)\s*\}", r"\1", text)

# Let's clean up try { const res = await request(...); return res.entry || res; }
text = re.sub(r"try\s*\{\s*(const res = await request\([^)]+\);\s*return res\.entry \|\| res;)\s*\}", r"\1", text)

# Clean up other generic try { return await request(...) }
text = re.sub(r"try\s*\{\s*(return await request[^}]+)\s*\}", r"\1", text)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("api.js patched via clean regex.")
