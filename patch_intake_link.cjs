const fs = require('fs');
let code = fs.readFileSync('src/components/IntakePortal.tsx', 'utf8');

code = code.replace(
  'onClick={() => setSelectedCase(c)}',
  'onClick={() => navigate(`/cases/${c.id}`)}'
);

fs.writeFileSync('src/components/IntakePortal.tsx', code);
