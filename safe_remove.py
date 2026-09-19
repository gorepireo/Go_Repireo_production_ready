import os
import re

directories = ['app', 'components', 'lib', 'context']

def clean_file(path):
    with open(path, 'r') as f:
        content = f.read()

    original = content
    
    # 1. Strip imports carefully line by line to avoid greedy matches
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if ('@/lib/db' in line or '@/lib/turso' in line) and 'import ' in line:
            # check if it's importing db
            if 'db' in line:
                continue # skip this import line
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # 2. Safely replace await db.database.from(...) with dummy
    # We'll use a non-greedy regex that just looks for the word db.database and the statement
    # A much safer way: replace `db.database.from` with `(null as any)?.from`
    # Replace `db.database` with `(null as any)`
    
    content = content.replace('db.database', '(null as any)')
    # If there are any `db` references left standing alone (which is hard to catch without AST),
    # let's just do `db.database` first.

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

