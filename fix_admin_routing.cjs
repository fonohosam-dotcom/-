const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  'const [adminTab, setAdminTab] = useState<"dashboard" | "approvals" | "auditors" | "integrity" | "ledger">("dashboard");',
  'const adminTab = view || "dashboard";'
);
code = code.replace(
  'onClick={() => setAdminTab("dashboard")}',
  'onClick={() => navigate("/admin/dashboard")}'
);
code = code.replace(
  'onClick={() => setAdminTab("approvals")}',
  'onClick={() => navigate("/admin/approvals")}'
);
code = code.replace(
  'onClick={() => setAdminTab("auditors")}',
  'onClick={() => navigate("/admin/auditors")}'
);
code = code.replace(
  'onClick={() => setAdminTab("integrity")}',
  'onClick={() => navigate("/admin/integrity")}'
);
code = code.replace(
  'onClick={() => setAdminTab("ledger")}',
  'onClick={() => navigate("/admin/ledger")}'
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
