import os
import json

path = os.path.join(os.getcwd(), 'backend', 'app', 'seed.py')
with open(path, 'r', encoding='utf-8') as f:
    content = f.read().strip()

# If it is a stringified JSON string, load it
if content.startswith('"') or content.startswith("'"):
    try:
        parsed = json.loads(content)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(parsed)
        print("Success: Unstringified seed.py")
    except Exception as e:
        # manual fallback
        decoded = content[1:-1].replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\').replace("\\'", "'").replace('\\"', '"')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(decoded)
        print("Success: Manually decoded seed.py")
else:
    print("seed.py is already normal.")
