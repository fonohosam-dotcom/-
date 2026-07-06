const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// I will just add `<>` and `</>` to the views
code = code.replace(
  /\{\(view === "geosos" \|\| view === "dashboard"\) && \(/g,
  '{(view === "geosos" || view === "dashboard") && (<>'
);
code = code.replace(
  /\{\(view === "cases" \|\| view === "dashboard"\) && \(/g,
  '{(view === "cases" || view === "dashboard") && (<>'
);
code = code.replace(
  /\{\(view === "projects" \|\| view === "dashboard"\) && \(/g,
  '{(view === "projects" || view === "dashboard") && (<>'
);
code = code.replace(
  /\{\(view === "funds" \|\| view === "dashboard"\) && \(/g,
  '{(view === "funds" || view === "dashboard") && (<>'
);

// The closing tags were supposed to be added by my original script but they were broken.
// Let's find them.
// "cases" end:
code = code.replace(
  /              <\/div>\n            <\/div>\n          \n        \)}\n\n        \{\(view === "cases"/,
  '              </div>\n            </div>\n          </>\n        )}\n\n        {(view === "cases"'
);
// Wait, my original script replaced:
// '              </div>\n            </div>\n\n            {/* Pending Applications Approval Box */}'
// with '... </>\n        )}\n\n        {(view === "cases" || view === "dashboard") && (\n          <>\n            ...'

// Let's just fix it automatically.
// The easiest way is to rewrite AdminPortal without all these broken tags.
// I will extract the blocks and wrap them properly.

fs.writeFileSync('src/components/AdminPortal.tsx', code);
