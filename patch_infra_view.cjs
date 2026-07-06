const fs = require('fs');
let code = fs.readFileSync('src/components/InfrastructurePortal.tsx', 'utf8');

code = code.replace(
  'interface InfrastructurePortalProps {',
  'import { useNavigate, useParams } from "react-router-dom";\ninterface InfrastructurePortalProps {\n  view?: "list" | "new" | "details";'
);

code = code.replace(
  'export default function InfrastructurePortal({\n  user,\n  projects,\n  onDonateToProject,\n  onAddProject,\n  onEditProject\n}: InfrastructurePortalProps) {',
  `export default function InfrastructurePortal({
  user,
  projects,
  onDonateToProject,
  onAddProject,
  onEditProject,
  view = "list"
}: InfrastructurePortalProps) {
  const navigate = useNavigate();
  const { id: routeProjId } = useParams();`
);

code = code.replace(
  'const [showAddForm, setShowAddForm] = useState(false);',
  'const showAddForm = view === "new";'
);

code = code.replace(
  'onClick={() => setShowAddForm(true)}',
  'onClick={() => navigate("/infrastructure/new")}'
);

code = code.replace(
  'onClick={() => setShowAddForm(false)}',
  'onClick={() => navigate("/infrastructure")}'
);

code = code.replace(
  'const canManage = user && ["admin", "system_architect", "field_coordinator"].includes(user.role);',
  `const canManage = user && ["admin", "system_architect", "field_coordinator"].includes(user.role);
  
  if (view === "details" && routeProjId) {
    const projDetails = projects.find(p => p.id === routeProjId);
    if (!projDetails) return <div className="p-8 text-center font-bold text-rose-500">المشروع غير موجود</div>;
    return (
      <div className="max-w-5xl mx-auto space-y-8 text-right animate-fade-in">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/infrastructure")} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-2">
            عودة
          </button>
          <h2 className="text-2xl font-black text-slate-900">تفاصيل المشروع: {projDetails.projectNumber || projDetails.id.substring(0,6)}</h2>
        </div>
        <div className="bg-white border border-[#E5E3DA] p-8 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-3xl font-black text-slate-900">{projDetails.title}</h3>
          <p className="text-slate-600 leading-relaxed text-sm">{projDetails.description}</p>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl flex-1 min-w-[150px] text-center">
              <p className="text-xs text-slate-500 font-bold">البلدية</p>
              <p className="font-black text-slate-800 mt-1">{projDetails.municipality}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl flex-1 min-w-[150px] text-center border border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold">المستهدف</p>
              <p className="font-black text-emerald-800 mt-1">{projDetails.targetAmount.toLocaleString()} د.ل</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl flex-1 min-w-[150px] text-center border border-blue-100">
              <p className="text-xs text-blue-700 font-bold">المجموع</p>
              <p className="font-black text-blue-800 mt-1">{projDetails.currentAmount.toLocaleString()} د.ل</p>
            </div>
          </div>
        </div>
      </div>
    );
  }`
);

code = code.replace(
  '<button className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-colors" title="التفاصيل">\n                          <ExternalLink className="w-4 h-4" />\n                        </button>',
  `<button onClick={() => navigate(\`/infrastructure/\${p.id}\`)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-colors" title="التفاصيل">
                          <ExternalLink className="w-4 h-4" />
                        </button>`
);

fs.writeFileSync('src/components/InfrastructurePortal.tsx', code);
