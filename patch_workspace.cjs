const fs = require('fs');
const content = fs.readFileSync('src/components/WorkspaceIntegration.tsx', 'utf8');

let newContent = content.replace('import { User } from "../types";', 'import { User, Case } from "../types";');

newContent = newContent.replace(
  'interface WorkspaceIntegrationProps {\n  user: User | null;\n  lang?: string;\n}',
  'interface WorkspaceIntegrationProps {\n  user: User | null;\n  cases?: Case[];\n  lang?: string;\n}'
);

newContent = newContent.replace(
  'export default function WorkspaceIntegration({ user, lang = "ar" }: WorkspaceIntegrationProps) {',
  'export default function WorkspaceIntegration({ user, cases = [], lang = "ar" }: WorkspaceIntegrationProps) {'
);

const tasksSyncFn = `
  const syncCasesToTasks = async (accessToken: string) => {
    // 1. Create a task list
    const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'مهام منصة التكافل - ' + new Date().toLocaleDateString('ar-SA')
      })
    });
    if (!listRes.ok) throw new Error("Tasks API failed to create list");
    const listData = await listRes.json();
    const taskListId = listData.id;

    // 2. Identify cases to sync based on user role
    const pendingCases = cases.filter(c => {
      if (user?.role === 'researcher') return c.status === 'pending';
      if (user?.role === 'admin') return c.status === 'pending' || c.status === 'investigated';
      return false;
    });

    if (pendingCases.length === 0) {
      throw new Error("لا توجد مهام معلقة لمزامنتها حالياً");
    }

    // 3. Add each pending case as a task
    for (const c of pendingCases) {
      await fetch(\`https://tasks.googleapis.com/tasks/v1/lists/\${taskListId}/tasks\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: \`متابعة ملف رقم: \${c.caseNumber}\`,
          notes: \`العائلة: \${c.familyName}\\nالاحتياج: \${c.category}\\nالموقع: \${c.location.city} - \${c.location.district}\`
        })
      });
      // Small delay to prevent rate limit
      await new Promise(res => setTimeout(res, 300));
    }
  };
`;

if (!newContent.includes('syncCasesToTasks')) {
  newContent = newContent.replace('  const createTasksList', tasksSyncFn + '\n  const createTasksList');
}

const newTasksUI = `
        {activeTab === "tasks" && (
          <div className="space-y-4 max-w-sm mx-auto">
            <CheckSquare className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-800">مهام المتابعة</h3>
            <p className="text-sm text-slate-500">مزامنة الحالات المعلقة كقائمة مهام جديدة في مهام جوجل لمتابعة تنفيذ المشاريع والمساعدات.</p>
            
            <button
              onClick={() => executeGoogleApiAction(syncCasesToTasks, "تم مزامنة المهام مع Google Tasks بنجاح")}
              disabled={loadingAction}
              className="mt-4 bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingAction ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              مزامنة المهام المعلقة
            </button>
            <button
              onClick={() => executeGoogleApiAction(createTasksList, "تم إنشاء قائمة المهام الفارغة بنجاح")}
              disabled={loadingAction}
              className="mt-2 bg-white text-blue-600 border border-blue-200 font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-blue-50 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              إنشاء قائمة "متابعة الحالات" فارغة
            </button>
          </div>
        )}
`;

if (newContent.includes('activeTab === "tasks"')) {
  newContent = newContent.replace(/\{activeTab === "tasks" && \([\s\S]*?\n        \)\}/m, newTasksUI.trim());
}

fs.writeFileSync('src/components/WorkspaceIntegration.tsx', newContent);
