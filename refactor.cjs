const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/\{activeTab === "home" && \([\s\S]*?<LandingView[\s\S]*?\/>\n\s*\)\}/, (match) => {
    return `<Routes>\n        <Route path="/" element={\n` + match.replace(/\{activeTab === "home" && \(/, '').replace(/\)\}/, '}\n        />');
});

const tabs = [
    {name: "cases", endTag: "IntakePortal"},
    {name: "infrastructure", endTag: "InfrastructurePortal"},
    {name: "map", endTag: "Suspense"},
    {name: "donation", endTag: "div"},
    {name: "reports", endTag: "Suspense"},
    {name: "printing", endTag: "OfficialPrintCenter"},
    {name: "security", endTag: "SecurityAuditVault"},
    {name: "verify", endTag: "PublicVerifyPortal"},
    {name: "supervision", endTag: "div"} // Wait, supervision ends with a React Fragment <> ... </> 
];

// Manual replacement might be easier using text ranges. Let's just create a modified App.tsx.
