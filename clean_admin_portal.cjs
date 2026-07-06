const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(/\{\(view === "geosos" \|\| view === "dashboard"\) && \(<>/g, '');
code = code.replace(/\{\(view === "cases" \|\| view === "dashboard"\) && \(<>/g, '');
code = code.replace(/\{\(view === "projects" \|\| view === "dashboard"\) && \(<>/g, '');
code = code.replace(/\{\(view === "funds" \|\| view === "dashboard"\) && \(<>/g, '');

code = code.replace(/\n\s*<\/>\n\s*\)\}\n\n\s*\{\(view === "cases"/g, '');
code = code.replace(/\n\s*<\/>\n\s*\)\}\n\n\s*\{\(view === "projects"/g, '');
code = code.replace(/\n\s*<\/>\n\s*\)\}\n\n\s*\{\(view === "funds"/g, '');

// Also I had this fix for funds closing:
code = code.replace(/\n\s*<\/>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/g, '\n          </div>\n        </div>\n      )}');

// Map view to adminTab properly
code = code.replace(
  'const adminTab = view || "dashboard";',
  `const adminTab = 
    view === "cases" || view === "projects" ? "approvals" :
    view === "geosos" ? "integrity" :
    view === "funds" ? "ledger" :
    view || "dashboard";`
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
