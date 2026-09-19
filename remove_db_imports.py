import os
import re

for root, _, files in os.walk('.'):
    for file in files:
        if not file.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, file)
        
        with open(path, 'r') as f:
            content = f.read()
            
        if 'lib/db' in content:
            content = re.sub(r'import\s+\{.*\}\s+from\s+[\'"]@/lib/db[\'"];?\n?', '', content)
            content = re.sub(r'import\s+db\s+from\s+[\'"]@/lib/db[\'"];?\n?', '', content)
            
            with open(path, 'w') as f:
                f.write(content)

