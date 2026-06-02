import os
import glob
import re

components_dir = r"c:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src\components"
files = glob.glob(os.path.join(components_dir, "*.jsx"))

replacements = {
    r'\btext-white\b': 'text-slate-900',
    r'\btext-white/40\b': 'text-slate-500',
    r'\btext-white/30\b': 'text-slate-500',
    r'\btext-white/50\b': 'text-slate-500',
    r'\btext-white/60\b': 'text-slate-600',
    r'\btext-white/70\b': 'text-slate-700',
    r'\btext-white/80\b': 'text-slate-800',
    r'\bborder-white/5\b': 'border-slate-100',
    r'\bborder-white/8\b': 'border-slate-200',
    r'\bborder-white/10\b': 'border-slate-200',
    r'\bborder-white/20\b': 'border-slate-300',
    r'\bbg-white/2\b': 'bg-slate-50',
    r'\bbg-white/3\b': 'bg-slate-50',
    r'\bbg-white/5\b': 'bg-slate-50',
    r'\bbg-white/10\b': 'bg-slate-100',
    r'\bbg-white/20\b': 'bg-slate-200',
    r'\bdivide-white/5\b': 'divide-slate-100',
    r'\bdivide-white/10\b': 'divide-slate-200',
}

for filepath in files:
    # Skip Dashboard.jsx since it's already redesigned for light theme
    if os.path.basename(filepath) == 'Dashboard.jsx':
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for old, new in replacements.items():
        content = re.sub(old, new, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")
