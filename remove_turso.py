import os
import re

directories = ['app', 'components', 'lib']

for root, _, files in os.walk('.'):
    for file in files:
        if not file.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, file)
        
        with open(path, 'r') as f:
            content = f.read()
            
        if 'turso' in content or 'db.database' in content:
            # Remove import { db } from "@/lib/turso"
            content = re.sub(r'import\s+\{\s*db\s*\}\s+from\s+[\'"]@/lib/turso[\'"];?\n?', '', content)
            
            # Replace await db.database.from(...)...; with { data: null, error: null }
            # Since it's multiline, we can use a regex that matches `await db.database.from([^;]+);`
            # and replaces it with `({ data: null, error: null } as any)`
            content = re.sub(r'await\s+db\.database[\s\S]*?;', '({ data: null, error: null } as any);', content)
            
            # For cases without await (e.g. let query = db.database.from...)
            content = re.sub(r'db\.database[\s\S]*?;', '({ data: null, error: null } as any);', content)
            
            with open(path, 'w') as f:
                f.write(content)
            print(f"Cleaned {path}")

