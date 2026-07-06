const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// replace the const adminTab declaration with a state
code = code.replace(/const adminTab = [\s\S]*?view \|\| "dashboard";/, 'const [adminTab, setAdminTab] = useState("dashboard");');

// replace the 'navigate' usage with 'setAdminTab'
code = code.replace(/onClick=\{\(\) => navigate\("\/admin\/dashboard"\)\}/g, 'onClick={() => setAdminTab("dashboard")}');
code = code.replace(/onClick=\{\(\) => navigate\("\/admin\/cases"\)\}/g, 'onClick={() => setAdminTab("approvals")}');
code = code.replace(/onClick=\{\(\) => navigate\("\/admin\/geosos"\)\}/g, 'onClick={() => setAdminTab("integrity")}');
code = code.replace(/onClick=\{\(\) => navigate\("\/admin\/funds"\)\}/g, 'onClick={() => setAdminTab("ledger")}');
code = code.replace(/onClick=\{\(\) => navigate\("\/admin\/users"\)\}/g, 'onClick={() => setAdminTab("users")}');
code = code.replace(/onClick=\{\(\) => navigate\("\/admin\/[a-z]+"\)\}/g, 'onClick={() => setAdminTab("dashboard")}');

fs.writeFileSync('src/components/AdminPortal.tsx', code);
