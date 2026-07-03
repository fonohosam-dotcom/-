import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# We'll just print out the number of handlers
handlers = re.findall(r'(  const handle[a-zA-Z0-9_]+ = .*?^  })', content, re.MULTILINE | re.DOTALL)
print(f"Found {len(handlers)} handlers")
