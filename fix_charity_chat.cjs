const fs = require('fs');
let content = fs.readFileSync('src/components/CharityPortal.tsx', 'utf8');

// Add import
content = content.replace(/import ImpactSimulator from ".\/ImpactSimulator";/, 'import ImpactSimulator from "./ImpactSimulator";\nimport GoogleChatWidget from "./GoogleChatWidget";');

// Add to render
content = content.replace(/    <\/div>\n  \);\n\}/, '      <GoogleChatWidget />\n    </div>\n  );\n}');
fs.writeFileSync('src/components/CharityPortal.tsx', content);
