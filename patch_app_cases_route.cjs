const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<Route path="\/cases" element=\{\s*<IntakePortal[\s\S]*?\/>\s*\} \/>/,
  `<Route path="/cases" element={
          <IntakePortal
            user={currentUser}
            cases={cases}
            onRegisterCase={handleRegisterCase}
            onUpdateFamily={handleUpdateFamily}
            onDeleteCase={handleDeleteCase}
            onUpdateCase={handleUpdateCase}
            view="list"
          />
        } />
        <Route path="/cases/new" element={
          <IntakePortal
            user={currentUser}
            cases={cases}
            onRegisterCase={handleRegisterCase}
            onUpdateFamily={handleUpdateFamily}
            onDeleteCase={handleDeleteCase}
            onUpdateCase={handleUpdateCase}
            view="new"
          />
        } />`
);

fs.writeFileSync('src/App.tsx', code);
