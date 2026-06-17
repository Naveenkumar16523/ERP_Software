import re

file_path = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src\utils\api.js"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

out = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Match standard single-line or multi-line try return request
    m1 = re.match(r'^(\s*)try\s*\{\s*return await request\((.*?)\);\s*\}\s*$', line)
    
    if m1:
        indent = m1.group(1)
        args = m1.group(2)
        # Check next line for catch
        if i+1 < len(lines) and "catch" in lines[i+1]:
            # It's a catch block. 
            out.append(f"{indent}return request({args});\n")
            # Skip until closing brace
            i += 1
            while i < len(lines):
                if "}" in lines[i]:
                    i += 1
                    break
                i += 1
            continue
            
    m2 = re.match(r'^(\s*)try\s*\{\s*const res = await request\((.*?)\);\s*return res\.entry \|\| res;\s*\}\s*$', line)
    if m2:
        indent = m2.group(1)
        args = m2.group(2)
        if i+1 < len(lines) and "catch" in lines[i+1]:
            out.append(f"{indent}const res = await request({args});\n{indent}return res.entry || res;\n")
            i += 1
            while i < len(lines):
                if "}" in lines[i]:
                    i += 1
                    break
                i += 1
            continue
            
    m3 = re.match(r'^(\s*)try\s*\{\s*return await request\((.*?)\);\s*\}\s*(.*?)$', line)
    if m3 and "catch" in m3.group(3):
        # Everything on one line
        indent = m3.group(1)
        args = m3.group(2)
        out.append(f"{indent}return request({args});\n")
        i += 1
        continue
        
    out.append(line)
    i += 1

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(out)

print("api.js patched via python line processor.")
