import os
import json

ROOT = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src"

def fix_file(file_path):
    print(f"Checking: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    # Check if the file is a JSON stringified file
    if (content.startswith('"') or content.startswith("'")) and '\\n' in content:
        try:
            # Parse the JSON string
            parsed = json.loads(content)
            if isinstance(parsed, str) and len(parsed) > 50:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(parsed)
                print(f"  ✅ Fixed: {file_path}")
                return True
        except Exception as e:
            # Fallback to evaluating single quotes if it was not valid JSON
            try:
                # Basic literal eval or stripping quotes
                if content.startswith("'") and content.endswith("'"):
                    # Quick decode
                    decoded = content[1:-1].replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\').replace("\\'", "'").replace('\\"', '"')
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(decoded)
                    print(f"  ✅ Fixed (manual decode): {file_path}")
                    return True
            except Exception as e2:
                print(f"  ❌ Error parsing {file_path}: {e} / {e2}")
    return False

def main():
    fixed = 0
    scanned = 0
    for root, dirs, files in os.walk(ROOT):
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in ['.js', '.jsx', '.ts', '.tsx']:
                scanned += 1
                full_path = os.path.join(root, file)
                if fix_file(full_path):
                    fixed += 1
    print(f"\nDone. Fixed {fixed} files out of {scanned} scanned.")

if __name__ == "__main__":
    main()
