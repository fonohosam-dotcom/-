const fs = require('fs');
let code = fs.readFileSync('src/components/IntakePortal.tsx', 'utf8');

code = code.replace(/setSubTab\("([a-z_]+)"\)/g, function(match, p1) {
  if (p1 === "register") return 'navigate("/intake/new")';
  return 'navigate("/intake")';
});

fs.writeFileSync('src/components/IntakePortal.tsx', code);
