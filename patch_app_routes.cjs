const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `import AdvancedAdmin from "./components/AdvancedAdmin";
import UsersManagement from "./components/UsersManagement";
import UserProfile from "./components/UserProfile";
`;

code = code.replace(
  'import { customFetch } from "./utils/api";',
  imports + '\nimport { customFetch } from "./utils/api";'
);

const routes = `        <Route path="/workspace" element={
          <WorkspaceIntegration user={currentUser} lang={lang} cases={cases} />
        } />
        <Route path="/users-management" element={
          <UsersManagement currentUser={currentUser} />
        } />
        <Route path="/feature-flags" element={
          <div className="max-w-4xl mx-auto"><AdvancedAdmin users={users} onRefresh={loadData} /></div>
        } />
        <Route path="/users/:id" element={
          <UserProfile />
        } />`;

code = code.replace(
  /<Route path="\/workspace" element=\{\s*<WorkspaceIntegration user=\{currentUser\} lang=\{lang\} cases=\{cases\} \/>\s*\} \/>/,
  routes
);

fs.writeFileSync('src/App.tsx', code);
