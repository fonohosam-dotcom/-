const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');
content = content.replace(/    <\/div>\n  \);\n\}/, '      <GoogleChatWidget />\n    </div>\n  );\n}');
fs.writeFileSync('src/components/AdminPortal.tsx', content);
