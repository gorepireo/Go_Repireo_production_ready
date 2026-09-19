import os
import re

directories = ['app', 'components', 'lib', 'context']

def clean_file(path):
    with open(path, 'r') as f:
        content = f.read()

    original = content
    
    # 1. Strip imports carefully line by line
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if '@/lib/turso' in line and 'import ' in line:
            continue # skip this import line
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    content = content.replace('insertTursoRecord', '(null as any)')
    content = content.replace('turso.execute', '(null as any)')
    content = content.replace('turso.batch', '(null as any)')

    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f"Cleaned {path}")

for root, _, files in os.walk('.'):
    if not any(d in root for d in directories):
        continue
    for file in files:
        if not file.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, file)
        clean_file(path)

