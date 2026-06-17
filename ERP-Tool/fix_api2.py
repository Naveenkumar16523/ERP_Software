import re

file_path = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src\utils\api.js"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip_until_brace = False

for i in range(len(lines)):
    line = lines[i]
    if skip_until_brace:
        if "}" in line:
            skip_until_brace = False
        continue

    # Match simple try line
    m1 = re.match(r'^(\s*)try\s*\{\s*return await request\((.*?)\);\s*\}\s*$', line)
    if m1:
        indent = m1.group(1)
        req_args = m1.group(2)
        # Check next line
        if i + 1 < len(lines) and "catch" in lines[i+1]:
            new_lines.append(f"{indent}return request({req_args});\n")
            skip_until_brace = True
            continue
    
    # Match complex try block starting
    m2 = re.match(r'^(\s*)try\s*\{\s*$', line)
    if m2 and i + 1 < len(lines) and "return await request(" in lines[i+1]:
        # This might be a multi-line try block
        pass # Let's handle it manually or skip if it's too complex

    new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("api.js patched line-by-line.")
