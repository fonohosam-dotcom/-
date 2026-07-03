const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const [users, setUsers] = useState<User[]>([]);',
  'const [users, setUsers] = useState<User[]>([]);\n  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({\n    module_map: true,\n    module_reports: true,\n    module_projects: true,\n    module_donation: true,\n    module_verify: true,\n  });'
);

code = code.replace(
  'if (data.status === "success") {',
  'if (data.status === "success") {\n          setFeatureFlags(data.state.featureFlags || {});'
);

fs.writeFileSync('src/App.tsx', code);
