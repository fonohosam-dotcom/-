import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, Users, DollarSign, Briefcase } from 'lucide-react';

export default function AdminPortal() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Aggregate data from API
      const casesRes = await apiFetch('/cases');
      const ledgerRes = await apiFetch('/ledger');
      const projectsRes = await apiFetch('/projects');
      
      const cases = casesRes.cases || [];
      const ledger = ledgerRes.ledger || [];
      const projects = projectsRes.projects || [];
      
      return {
        totalCases: cases.length,
        totalDonations: ledger.filter((l:any) => l.amount > 0).reduce((acc: number, l:any) => acc + l.amount, 0),
        activeProjects: projects.filter((p:any) => p.status !== 'completed').length,
        chartData: [
          { name: 'يناير', donations: 4000, cases: 24 },
          { name: 'فبراير', donations: 3000, cases: 13 },
          { name: 'مارس', donations: 2000, cases: 48 },
          { name: 'أبريل', donations: 2780, cases: 39 },
          { name: 'مايو', donations: 1890, cases: 48 },
          { name: 'يونيو', donations: 2390, cases: 38 },
          { name: 'يوليو', donations: 3490, cases: 43 },
        ]
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="text-emerald-500" />
          مركز التحكم الإداري
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          مراقبة الأداء، الإيرادات، والحالات الحية
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="text-blue-500" />} title="إجمالي الحالات" value={stats?.totalCases || 0} />
        <StatCard icon={<DollarSign className="text-emerald-500" />} title="حجم التبرعات (د.ل)" value={(stats?.totalDonations || 0).toLocaleString()} />
        <StatCard icon={<Briefcase className="text-amber-500" />} title="مشاريع نشطة" value={stats?.activeProjects || 0} />
        <StatCard icon={<Activity className="text-purple-500" />} title="نسبة الإنجاز" value="78%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold mb-6">معدل التبرعات (الشهري)</h2>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{fill: '#64748b'}} />
                <YAxis tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                <Legend />
                <Line type="monotone" dataKey="donations" name="التبرعات" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold mb-6">الحالات المعالجة</h2>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{fill: '#64748b'}} />
                <YAxis tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                <Legend />
                <Bar dataKey="cases" name="الحالات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
