const fs = require('fs');
let code = fs.readFileSync('src/components/InfrastructurePortal.tsx', 'utf8');

code = code.replace(
  'onClick={() => setShowAddForm(true)}',
  'onClick={() => navigate("/infrastructure/new")}'
);

code = code.replace(
  'onClick={() => setShowAddForm(false)}',
  'onClick={() => navigate("/infrastructure")}'
);

fs.writeFileSync('src/components/InfrastructurePortal.tsx', code);
