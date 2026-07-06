const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<main className="max-w-6xl mx-auto px-4 py-8 min-h-\[70vh\]">[\s\S]*?<\/main>/m;

const newMain = `<main className="max-w-6xl mx-auto px-4 py-8 min-h-[70vh]">
          {activeTab === "home" && (
            <LandingView
              onNavigate={(tab) => {
                setActiveTab(tab as any);
                window.scrollTo(0, 0);
              }}
              stats={{
                families: users.filter((u) => u.role === "citizen").length,
                funds: funds.reduce((acc, f) => acc + f.balance, 0),
                cases: cases.filter((c) => c.status === "closed").length,
              }}
            />
          )}

          {activeTab === "donation" && (
            <DonorPortal
              user={currentUser}
              cases={cases}
              projects={projects}
              onDonate={handleDonation}
              onSubmitSkill={() => {}}
              activeGeoSOS={activeGeoSOS}
              onTriggerGeoSOS={handleTriggerGeoSOS}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "citizen" && (
            <CitizenPortal
              user={currentUser}
              citizenCase={citizenCase}
              onRegisterCase={handleRegisterCase}
              onUpdateFamily={handleUpdateFamily}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "researcher" && (
            <ResearcherPortal
              user={currentUser}
              cases={cases}
              onSubmitVisit={handleSubmitVisitReport}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "charity" && (
            <CharityPortal
              user={currentUser}
              cases={cases}
              onAdopt={handleAdoptCaseByCharity}
              onDisburse={handleDisburseCaseByCharity}
              lang={lang}
            />
          )}

          {activeTab === "cases" && currentUser?.role === "field_coordinator" && (
            <VolunteerPortal
              user={currentUser}
              cases={cases}
            />
          )}

          {activeTab === "admin/cases" && currentUser?.role === "admin" && (
            <AdminPortal
              user={currentUser}
              users={users}
              cases={cases}
              projects={projects}
              ledger={ledger}
              funds={funds}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              onApproveCase={handleApproveCaseByAdmin}
              onRejectCase={handleRejectCaseByAdmin}
              onUpdateBudget={handleUpdateCaseBudgetByAdmin}
              onApproveProject={handleApproveProjectByAdmin}
              lang={lang}
            />
          )}
          
          {activeTab === "admin/projects" && currentUser?.role === "admin" && (
            <AdminPortal
              user={currentUser}
              users={users}
              cases={cases}
              projects={projects}
              ledger={ledger}
              funds={funds}
              onDeleteCase={handleDeleteCase}
              onUpdateCase={handleUpdateCase}
              onApproveCase={handleApproveCaseByAdmin}
              onRejectCase={handleRejectCaseByAdmin}
              onUpdateBudget={handleUpdateCaseBudgetByAdmin}
              onApproveProject={handleApproveProjectByAdmin}
              lang={lang}
            />
          )}

          {activeTab === "infrastructure" && (
            <InfrastructurePortal
              projects={projects}
              cases={cases}
              user={currentUser}
              lang={lang}
            />
          )}

          {activeTab === "verify" && (
            <PublicVerifyPortal
              cases={cases}
              reports={reports}
              users={users}
              onAddReport={handleAddReport}
              lang={lang}
            />
          )}

          {activeTab === "map" && (
            <MapsSearchPortal
              cases={cases}
              projects={projects}
              charities={users.filter(u => u.role === "charity")}
              lang={lang}
            />
          )}

          {activeTab === "reports" && (
            <InteractiveReports
              cases={cases}
              projects={projects}
              ledger={ledger}
              funds={funds}
              lang={lang}
            />
          )}

          {activeTab === "printing" && (
            <OfficialPrintCenter
              cases={cases}
              projects={projects}
              user={currentUser}
              lang={lang}
            />
          )}

          {activeTab === "security" && currentUser?.role === "admin" && (
            <SecurityAuditVault
              cases={cases}
              projects={projects}
              ledger={ledger}
              users={users}
              lang={lang}
            />
          )}
        </main>`;

code = code.replace(regex, newMain);
// Let's remove the imports for Suspense, Routes, Route, and RefreshCw
code = code.replace(/import { Suspense } from "react";\n/g, "");
code = code.replace(/import { Routes, Route } from "react-router-dom";\n/g, "");
code = code.replace(/import { RefreshCw } from "lucide-react";\n/g, "");

fs.writeFileSync('src/App.tsx', code);
console.log("Reverted App.tsx main block");
