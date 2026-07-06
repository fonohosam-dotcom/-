const fs = require('fs');
let code = fs.readFileSync('src/components/IntakePortal.tsx', 'utf8');

code = code.replace(
  'interface IntakePortalProps {',
  'interface IntakePortalProps {\n  view?: "list" | "new" | "details";'
);

code = code.replace(
  'export default function IntakePortal({\n  user,\n  cases,\n  onRegisterCase,\n  onUpdateFamily,\n  onDeleteCase,\n  onUpdateCase,\n}: IntakePortalProps) {',
  `import { useNavigate, useParams } from "react-router-dom";
export default function IntakePortal({
  user,
  cases,
  onRegisterCase,
  onUpdateFamily,
  onDeleteCase,
  onUpdateCase,
  view = "list"
}: IntakePortalProps) {
  const navigate = useNavigate();
  const { id: routeCaseId } = useParams();`
);

code = code.replace(
  'const [subTab, setSubTab] = useState<"register" | "manage">("manage");',
  'const subTab = view === "new" ? "register" : "manage";'
);

code = code.replace(
  '<div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-4">',
  '{/*<div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-4">'
);
code = code.replace(
  '<span>إدراج مستفيد جديد بالسجل الوطني</span>\n        </button>\n      </div>',
  '<span>إدراج مستفيد جديد بالسجل الوطني</span>\n        </button>\n      </div>*/}'
);

code = code.replace(
  'const isCitizen = user?.role === "citizen";',
  `const isCitizen = user?.role === "citizen";
  if (view === "details" && routeCaseId) {
    const caseDetails = cases.find(c => c.id === routeCaseId);
    if (!caseDetails) return <div className="p-8 text-center text-rose-500 font-bold">الحالة غير موجودة</div>;
    return (
      <div className="max-w-5xl mx-auto space-y-6 text-right animate-fade-in">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/cases")} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> العودة للقائمة
          </button>
          <h2 className="text-2xl font-black text-slate-900">الملف التفصيلي: {caseDetails.caseNumber}</h2>
        </div>
        <div className="bg-white border border-[#E5E3DA] p-8 rounded-3xl shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-800 border-b pb-2">بيانات المستفيد</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-slate-500 ml-2">الاسم:</span> <strong className="text-slate-900">{caseDetails.headOfHouseholdName}</strong></p>
                <p><span className="text-slate-500 ml-2">الرقم الوطني:</span> <strong className="text-slate-900 font-mono">{caseDetails.nationalId}</strong></p>
                <p><span className="text-slate-500 ml-2">الهاتف:</span> <strong className="text-slate-900 font-mono">{caseDetails.phone || "لا يوجد"}</strong></p>
                <p><span className="text-slate-500 ml-2">البلدية:</span> <strong className="text-slate-900">{caseDetails.municipality}</strong></p>
                <p><span className="text-slate-500 ml-2">النقاط:</span> <strong className="text-emerald-700 font-black">{caseDetails.needScore}</strong></p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-800 border-b pb-2">موقف الحالة</h3>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-slate-500 ml-2">الحالة الحالية:</span> 
                  <span className={\`px-2 py-1 rounded text-xs font-bold \${caseDetails.status === "approved" ? "bg-emerald-100 text-emerald-700" : caseDetails.status === "active" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}\`}>
                    {caseDetails.status === "pending" ? "قيد الدراسة" : caseDetails.status === "approved" ? "معتمدة وجاهزة" : "نشطة ومدعومة"}
                  </span>
                </p>
                <p><span className="text-slate-500 ml-2">تاريخ الإدراج:</span> <strong className="text-slate-900 font-mono">{new Date(caseDetails.createdAt).toLocaleDateString("ar-SA")}</strong></p>
                <p><span className="text-slate-500 ml-2">أولوية الملف:</span> <strong className="text-slate-900">{caseDetails.priorityLevel}</strong></p>
                <p><span className="text-slate-500 ml-2">قيمة الاحتياج:</span> <strong className="text-rose-600 font-black">{caseDetails.amountRequired.toLocaleString()} د.ل</strong></p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">ملف العائلة (Family Composition)</h3>
            {caseDetails.family && caseDetails.family.members.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-3 font-bold text-slate-600">الاسم</th>
                      <th className="p-3 font-bold text-slate-600">القرابة</th>
                      <th className="p-3 font-bold text-slate-600">الرقم الوطني</th>
                      <th className="p-3 font-bold text-slate-600">تاريخ الميلاد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caseDetails.family.members.map((m, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold">{m.name}</td>
                        <td className="p-3">{m.relationship}</td>
                        <td className="p-3 font-mono text-slate-500">{m.nationalId}</td>
                        <td className="p-3 font-mono text-slate-500">{m.birthDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-slate-500 bg-slate-50 rounded-xl text-center text-sm">لا يوجد أفراد مسجلين في دفتر العائلة.</div>
            )}
          </div>
        </div>
      </div>
    );
  }
  `
);

fs.writeFileSync('src/components/IntakePortal.tsx', code);
