import ast
import sys

try:
    with open('app/models/models.py', 'r', encoding='utf-8') as f:
        code = f.read()
    
    tree = ast.parse(code)
    classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
    
    print('Database Tables (Classes):')
    for cls in classes:
        print(f'- {cls}')
except Exception as e:
    print(f"Error: {e}")
