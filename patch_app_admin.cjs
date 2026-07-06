const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /{activeTab === "admin\/cases"[\s\S]*?<\/AdminPortal>[\s\S]*?\)}/m;

const replacement = `{activeTab.startsWith("admin/") && currentUser?.role === "admin" && (
            <AdminPortal
              view={activeTab.split("/")[1] as any}
              user={currentUser}
              users={users}
              cases={cases}
              projects={projects}
              ledger={ledger}
              funds={funds}
              reports={reports}
              onApproveCase={handleApproveCaseByAdmin}
              onRejectCase={handleRejectCaseByAdmin}
              onUpdateCaseBudget={handleUpdateCaseBudgetByAdmin}
              onApproveProject={handleApproveProjectByAdmin}
              onRejectProject={handleRejectProjectByAdmin}
              onUpdateProjectBudget={handleUpdateProjectBudgetByAdmin}
              onUpdateReportStatus={handleUpdateReportStatus}
              lang={lang}
            />
          )}`;

code = code.replace(regex, replacement);

const regex2 = /{activeTab === "admin\/projects"[\s\S]*?<\/AdminPortal>[\s\S]*?\)}/m;
code = code.replace(regex2, '');

fs.writeFileSync('src/App.tsx', code);
