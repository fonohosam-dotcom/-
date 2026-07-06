const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<Route path="/infrastructure" element={
          <InfrastructurePortal
            user={currentUser}
            projects={projects}
            onDonateToProject={async (projId, amount) => {
              await handleDonate({
                donorId: currentUser?.id || null,
                donorNameOverride: currentUser?.fullName || "متبرع فاعل خير",
                projectId: projId,
                fundType: "صدقة_جارية",
                amount: amount,
                currency: "LYD",
                paymentMethod: "بوابة البنية التحتية"
              });
            }}
          />
        } />`;

const infraProps = `user={currentUser}
            projects={projects}
            onDonateToProject={async (projId, amount) => {
              await handleDonate({
                donorId: currentUser?.id || null,
                donorNameOverride: currentUser?.fullName || "متبرع فاعل خير",
                projectId: projId,
                fundType: "صدقة_جارية",
                amount: amount,
                currency: "LYD",
                paymentMethod: "بوابة البنية التحتية"
              });
            }}`;

const replacement = `<Route path="/infrastructure" element={
          <InfrastructurePortal
            ${infraProps}
            view="list"
          />
        } />
        <Route path="/infrastructure/new" element={
          <InfrastructurePortal
            ${infraProps}
            view="new"
          />
        } />
        <Route path="/infrastructure/:id" element={
          <InfrastructurePortal
            ${infraProps}
            view="details"
          />
        } />`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
