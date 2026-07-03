const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldNav = `const navGroups = [
    {
      title: lang === "ar" ? "الخدمات العامة" : "Public Services",
      showGroup: true,
      items: [
        { id: "home", label: t.navHome || "الرئيسية", icon: Home, colorClass: "text-[#10B981]", bgColor: "bg-emerald-500/20", show: true },
        { id: "donation", label: t.navDonateNow || "تبرع الآن", icon: Coins, colorClass: "text-amber-500", bgColor: "bg-amber-500/20", show: true },
        { id: "verify", label: lang === "ar" ? "التحقق ومكافحة الاحتيال" : "Public Verify", icon: ShieldCheck, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: true },
        { id: "reports", label: t.navReports || "التقارير والمؤشرات", icon: FileText, colorClass: "text-yellow-500", bgColor: "bg-yellow-500/20", show: true },
      ]
    },
    {
      title: lang === "ar" ? "العمليات والميدان" : "Field & GIS",
      showGroup: true,
      items: [
        { id: "map", label: t.navMapsSearch || "الخرائط والبحث", icon: Map, colorClass: "text-sky-500", bgColor: "bg-sky-500/20", show: true },
        { id: "cases", label: t.navAddBeneficiary || "الحالات الميدانية", icon: Heart, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: !!currentUser && ["admin", "researcher", "charity"].includes(currentUser.role) },
        { id: "infrastructure", label: t.navHospitalsSchools || "المشاريع الكبرى", icon: Building2, colorClass: "text-indigo-500", bgColor: "bg-indigo-500/20", show: true },
      ]
    },
    {
      title: lang === "ar" ? "الإدارة والرقابة" : "Management",
      showGroup: true,
      items: [
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
        { id: "workspace", label: lang === "ar" ? "تكامل مساحة العمل" : "Workspace Integration", icon: Globe, colorClass: "text-blue-600", bgColor: "bg-blue-600/20", show: !!currentUser && ["admin", "charity", "researcher"].includes(currentUser.role) },
      ]
    }
  ];`;

const newNav = `const navGroups = [
    {
      title: lang === "ar" ? "الخدمات العامة" : "Public Services",
      showGroup: true,
      items: [
        { id: "home", label: t.navHome || "الرئيسية", icon: Home, colorClass: "text-[#10B981]", bgColor: "bg-emerald-500/20", show: featureFlags.module_home !== false },
        { id: "donation", label: t.navDonateNow || "تبرع الآن", icon: Coins, colorClass: "text-amber-500", bgColor: "bg-amber-500/20", show: featureFlags.module_donation !== false },
        { id: "verify", label: lang === "ar" ? "التحقق ومكافحة الاحتيال" : "Public Verify", icon: ShieldCheck, colorClass: "text-rose-500", bgColor: "bg-rose-500/20", show: featureFlags.module_verify !== false },
        { id: "reports", label: t.navReports || "التقارير والمؤشرات", icon: FileText, colorClass: "text-yellow-500", bgColor: "bg-yellow-500/20", show: featureFlags.module_reports !== false },
      ]
    },
    {
      title: lang === "ar" ? "العمليات والميدان" : "Field & GIS",
      showGroup: true,
      items: [
        { id: "map", label: t.navMapsSearch || "الخرائط والبحث", icon: Map, colorClass: "text-sky-500", bgColor: "bg-sky-500/20", show: featureFlags.module_map !== false },
        { id: "cases", label: t.navAddBeneficiary || "الحالات الميدانية", icon: Heart, colorClass: "text-emerald-500", bgColor: "bg-emerald-500/20", show: !!currentUser && ["admin", "researcher", "charity", "field_coordinator"].includes(currentUser.role) },
        { id: "infrastructure", label: t.navHospitalsSchools || "المشاريع الكبرى", icon: Building2, colorClass: "text-indigo-500", bgColor: "bg-indigo-500/20", show: featureFlags.module_projects !== false },
      ]
    },
    {
      title: lang === "ar" ? "الإدارة والرقابة" : "Management",
      showGroup: true,
      items: [
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
      ]
    }
  ];`;

code = code.replace(oldNav, newNav);
fs.writeFileSync('src/App.tsx', code);
