const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  '              ) : (\n                \n                  {addAdminSuccess && (',
  '              ) : (\n                <>\n                  {addAdminSuccess && ('
);

code = code.replace(
  '                  )}\n                              )}\n            </div>',
  '                  )}\n                </>\n              )}\n            </div>'
);

// We need to fix the `<>` fragment that I tried to insert at 1377 via sed which didn't work.
// I will just use regex to clean up all the `) : (<>`
code = code.replace(/\) : \(<>\n/g, ') : (\n                <>\n');
// Ensure only one `<>`
code = code.replace(/<>\s*<>\s*/g, '<>\n');

fs.writeFileSync('src/components/AdminPortal.tsx', code);
