import os
import glob
import re

files_to_update = glob.glob('src/hooks/*.js')

pattern = re.compile(
    r'(?:export )?const useOptimisticCreate = \(queryKey, endpoint\) => \{.*?\n\};',
    re.DOTALL
)

for filepath in files_to_update:
    if filepath.endswith('useOptimisticCreate.js'):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'useOptimisticCreate' in content and 'const useOptimisticCreate =' in content:
        content = pattern.sub('', content)
        import_stmt = "import { useOptimisticCreate } from './useOptimisticCreate';\n"
        content = import_stmt + content.lstrip()
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filepath}')
