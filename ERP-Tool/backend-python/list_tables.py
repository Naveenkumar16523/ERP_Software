with open('app/models/models.py', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print('Database Tables:')
for i, line in enumerate(lines):
    if 'class' in line and 'Base' in line:
        print(f'{i+1}: {line.strip()}')
