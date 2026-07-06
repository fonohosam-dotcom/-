const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// I will just replace `)} \n {(view ===` with `</>)}\n\n {(view ===`
code = code.replace(
  /\n\s*\)\}\n\n\s*\{\(view === "cases"/g,
  '\n              </>\n            )}\n\n        {(view === "cases"'
);
code = code.replace(
  /\n\s*\)\}\n\n\s*\{\(view === "projects"/g,
  '\n              </>\n            )}\n\n        {(view === "projects"'
);
code = code.replace(
  /\n\s*\)\}\n\n\s*\{\(view === "funds"/g,
  '\n              </>\n            )}\n\n        {(view === "funds"'
);

// The end of the funds view:
code = code.replace(
  /\n\s*\)\}\n\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/g,
  '\n              </>\n            )}\n          </div>\n        </div>\n      )}'
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
