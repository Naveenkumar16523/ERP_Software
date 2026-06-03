import os
path = os.path.join(os.getcwd(), 'backend', 'app', 'seed.py')
with open(path, 'r', encoding='utf-8') as f:
    print(f.read())
