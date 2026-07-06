const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will add the routes
const newRoutes = `        <Route path="/admin/cases" element={
          <AdminPortal user={currentUser} cases={cases} projects={projects} ledger={ledger} funds={funds} reports={reports} users={users} onApproveCase={handleApproveCase} onRejectCase={handleRejectCase} onUpdateCaseBudget={handleUpdateCaseBudget} onApproveProject={handleApproveProject} onRejectProject={handleRejectProject} onUpdateProjectBudget={handleUpdateProjectBudget} onUpdateReportStatus={handleUpdateReportStatus} onRefresh={loadData} view="cases" />
        } />
        <Route path="/admin/projects" element={
          <AdminPortal user={currentUser} cases={cases} projects={projects} ledger={ledger} funds={funds} reports={reports} users={users} onApproveCase={handleApproveCase} onRejectCase={handleRejectCase} onUpdateCaseBudget={handleUpdateCaseBudget} onApproveProject={handleApproveProject} onRejectProject={handleRejectProject} onUpdateProjectBudget={handleUpdateProjectBudget} onUpdateReportStatus={handleUpdateReportStatus} onRefresh={loadData} view="projects" />
        } />
        <Route path="/admin/geosos" element={
          <AdminPortal user={currentUser} cases={cases} projects={projects} ledger={ledger} funds={funds} reports={reports} users={users} onApproveCase={handleApproveCase} onRejectCase={handleRejectCase} onUpdateCaseBudget={handleUpdateCaseBudget} onApproveProject={handleApproveProject} onRejectProject={handleRejectProject} onUpdateProjectBudget={handleUpdateProjectBudget} onUpdateReportStatus={handleUpdateReportStatus} onRefresh={loadData} view="geosos" />
        } />
        <Route path="/admin/funds" element={
          <AdminPortal user={currentUser} cases={cases} projects={projects} ledger={ledger} funds={funds} reports={reports} users={users} onApproveCase={handleApproveCase} onRejectCase={handleRejectCase} onUpdateCaseBudget={handleUpdateCaseBudget} onApproveProject={handleApproveProject} onRejectProject={handleRejectProject} onUpdateProjectBudget={handleUpdateProjectBudget} onUpdateReportStatus={handleUpdateReportStatus} onRefresh={loadData} view="funds" />
        } />
        <Route path="/supervision" element={
          <AdminPortal user={currentUser} cases={cases} projects={projects} ledger={ledger} funds={funds} reports={reports} users={users} onApproveCase={handleApproveCase} onRejectCase={handleRejectCase} onUpdateCaseBudget={handleUpdateCaseBudget} onApproveProject={handleApproveProject} onRejectProject={handleRejectProject} onUpdateProjectBudget={handleUpdateProjectBudget} onUpdateReportStatus={handleUpdateReportStatus} onRefresh={loadData} view="dashboard" />
        } />`;

code = code.replace(
  /<Route path="\/supervision" element=\{\s*<AdminPortal[\s\S]*?\/>\s*\} \/>/,
  newRoutes
);

// We should also add these items to the navGroups for Admins!
// Let's modify navGroups string in App.tsx
const oldNavGroups = `      items: [
        { 
          id: "supervision", 
          label: currentUser?.role === "citizen" ? (lang === "ar" ? "لوحة المستفيد" : "Beneficiary") : (t.navSupervisionGovernance || "الإشراف والتدقيق"), 
          icon: Settings, 
          colorClass: "text-violet-500", 
          bgColor: "bg-violet-500/20", 
          show: !!currentUser 
        },
        { id: "printing", label: t.navPrintCenter || "سجلات الطباعة", icon: Printer, colorClass: "text-blue-500", bgColor: "bg-blue-500/20", show: !!currentUser && ["admin", "researcher", "charity"].includes(currentUser.role) },
        { id: "security", label: t.navSecurityIntegrity || "سجل التدقيق الأمني", icon: ShieldAlert, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: !!currentUser && currentUser.role === "admin" },
        { id: "workspace", label: lang === "ar" ? "تكامل مساحة العمل" : "Workspace Integration", icon: Globe, colorClass: "text-blue-600", bgColor: "bg-blue-600/20", show: !!currentUser && ["admin", "charity", "researcher", "data_analyst", "content_manager"].includes(currentUser.role) },
        { id: "users-management", label: "إدارة المستخدمين والصلاحيات", icon: Users, colorClass: "text-emerald-600", bgColor: "bg-emerald-600/20", show: !!currentUser && ["admin", "system_architect"].includes(currentUser.role) },
        { id: "feature-flags", label: "التحكم بالأقسام والميزات", icon: Power, colorClass: "text-indigo-600", bgColor: "bg-indigo-600/20", show: !!currentUser && ["admin", "system_architect"].includes(currentUser.role) },
      ]`;

const newNavGroups = `      items: [
        { 
          id: "supervision", 
          label: currentUser?.role === "citizen" ? (lang === "ar" ? "لوحة المستفيد" : "Beneficiary") : "لوحة التحكم الرئيسية", 
          icon: Settings, 
          colorClass: "text-violet-500", 
          bgColor: "bg-violet-500/20", 
          show: !!currentUser 
        },
        { id: "admin/cases", label: "الطلبات والموافقات", icon: FileText, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
        { id: "admin/projects", label: "اعتماد المشاريع", icon: Building2, colorClass: "text-blue-500", bgColor: "bg-blue-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
        { id: "admin/funds", label: "إدارة الصناديق", icon: Coins, colorClass: "text-amber-500", bgColor: "bg-amber-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
        { id: "admin/geosos", label: "نداء الطوارئ الميداني", icon: Radio, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },
        { id: "printing", label: t.navPrintCenter || "سجلات الطباعة", icon: Printer, colorClass: "text-slate-500", bgColor: "bg-slate-500/20", show: !!currentUser && ["admin", "researcher", "charity"].includes(currentUser.role) },
        { id: "security", label: t.navSecurityIntegrity || "سجل التدقيق الأمني", icon: ShieldAlert, colorClass: "text-rose-600", bgColor: "bg-rose-600/20", show: !!currentUser && currentUser.role === "admin" },
        { id: "workspace", label: lang === "ar" ? "تكامل مساحة العمل" : "Workspace Integration", icon: Globe, colorClass: "text-blue-600", bgColor: "bg-blue-600/20", show: !!currentUser && ["admin", "charity", "researcher", "data_analyst", "content_manager"].includes(currentUser.role) },
        { id: "users-management", label: "إدارة المستخدمين والصلاحيات", icon: UserCheck, colorClass: "text-emerald-600", bgColor: "bg-emerald-600/20", show: !!currentUser && ["admin", "system_architect"].includes(currentUser.role) },
        { id: "feature-flags", label: "التحكم بالأقسام والميزات", icon: Power, colorClass: "text-indigo-600", bgColor: "bg-indigo-600/20", show: !!currentUser && ["admin", "system_architect"].includes(currentUser.role) },
      ]`;

if(code.includes(oldNavGroups)) {
   code = code.replace(oldNavGroups, newNavGroups);
} else {
   // Try simpler replacement
   code = code.replace(
      '{ id: "printing",',
      '{ id: "admin/cases", label: "الطلبات والموافقات", icon: FileText, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },\n        { id: "admin/projects", label: "اعتماد المشاريع", icon: Building2, colorClass: "text-blue-500", bgColor: "bg-blue-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },\n        { id: "admin/funds", label: "إدارة الصناديق", icon: Coins, colorClass: "text-amber-500", bgColor: "bg-amber-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },\n        { id: "admin/geosos", label: "نداء الطوارئ الميداني", icon: Radio, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: !!currentUser && ["admin"].includes(currentUser.role) },\n        { id: "printing",'
   );
}

fs.writeFileSync('src/App.tsx', code);
