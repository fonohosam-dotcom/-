const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => setAdminTab\("dashboard"\)\}\n(.*)adminTab === "approvals"/g, 'onClick={() => setAdminTab("approvals")}\n$1adminTab === "approvals"');
code = code.replace(/onClick=\{\(\) => setAdminTab\("dashboard"\)\}\n(.*)adminTab === "auditors"/g, 'onClick={() => setAdminTab("auditors")}\n$1adminTab === "auditors"');
code = code.replace(/onClick=\{\(\) => setAdminTab\("dashboard"\)\}\n(.*)adminTab === "integrity"/g, 'onClick={() => setAdminTab("integrity")}\n$1adminTab === "integrity"');
code = code.replace(/onClick=\{\(\) => setAdminTab\("dashboard"\)\}\n(.*)adminTab === "ledger"/g, 'onClick={() => setAdminTab("ledger")}\n$1adminTab === "ledger"');

fs.writeFileSync('src/components/AdminPortal.tsx', code);
