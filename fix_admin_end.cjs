const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const regex = /\{\/\*\s*Central registry of verified users\s*\*\/\}[\s\S]*?\{\/\*\s*Advanced Admin controls \(Feature Flags \+ Ban\/Delete users\)\s*\*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

code = code.replace(regex, `          </div>
        </div>
      )}`);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
