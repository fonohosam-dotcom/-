const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const staticImports = [
  'LandingView', 'CitizenPortal', 'ResearcherPortal', 'DonorPortal',
  'CharityPortal', 'VolunteerPortal', 'AdminPortal', 'PaymentHub',
  'IntakePortal', 'InfrastructurePortal', 'OfficialPrintCenter',
  'SecurityAuditVault', 'PublicVerifyPortal'
];

staticImports.forEach(comp => {
  code = code.replace(new RegExp(`import ${comp} from "\\./components/${comp}";\\n`), `const ${comp} = lazy(() => import("./components/${comp}"));\n`);
});

fs.writeFileSync('src/App.tsx', code, 'utf-8');
