const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<Route path="/cases/new" element={
          <IntakePortal
            user={currentUser}
            cases={cases}
            onRegisterCase={handleRegisterCase}
            onUpdateFamily={handleUpdateFamily}
            onDeleteCase={handleDeleteCase}
            onUpdateCase={handleUpdateCase}
            view="new"
          />
        } />`;

const replacement = `<Route path="/cases/new" element={
          <IntakePortal
            user={currentUser}
            cases={cases}
            onRegisterCase={handleRegisterCase}
            onUpdateFamily={handleUpdateFamily}
            onDeleteCase={handleDeleteCase}
            onUpdateCase={handleUpdateCase}
            view="new"
          />
        } />
        <Route path="/cases/:id" element={
          <IntakePortal
            user={currentUser}
            cases={cases}
            onRegisterCase={handleRegisterCase}
            onUpdateFamily={handleUpdateFamily}
            onDeleteCase={handleDeleteCase}
            onUpdateCase={handleUpdateCase}
            view="details"
          />
        } />`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
