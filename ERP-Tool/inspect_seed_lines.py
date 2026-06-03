import os
path = os.path.join(os.getcwd(), 'backend', 'app', 'seed.py')
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace actual newlines from the double quotes
text = text.replace('\\n', '\n')

lines = text.split('\n')
for i, line in enumerate(lines):
    if 'User(' in line or 'email' in line or 'password' in line or 'admin' in line or '@' in line:
        print(f"L{i}: {line[:120]}")
