const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
if (!code.includes('isBanned?: boolean')) {
  code = code.replace(
    'isAnonymous?: boolean;',
    'isAnonymous?: boolean;\n  isBanned?: boolean;\n  isHidden?: boolean;'
  );
  fs.writeFileSync('src/types.ts', code);
}
