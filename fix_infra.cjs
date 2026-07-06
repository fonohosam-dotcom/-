const fs = require('fs');
let code = fs.readFileSync('src/components/InfrastructurePortal.tsx', 'utf8');

code = code.replace(/const showAddForm = view === "new";/, 'const navigate = useNavigate();\n  const showAddForm = view === "new";');
code = code.replace(/setShowAddForm\(false\);/g, 'navigate("/infrastructure");');
code = code.replace(/setShowAddForm\(!showAddForm\)/g, 'navigate(showAddForm ? "/infrastructure" : "/infrastructure/new")');

fs.writeFileSync('src/components/InfrastructurePortal.tsx', code);
