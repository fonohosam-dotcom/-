import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Activity, Award, Download, Building2 } from "lucide-react";
import { customFetch } from "../utils/api";
import { Case, Fund } from "../types";

export default function CharityAnalyticsDashboard({ lang, theme }: { lang: any; theme: string }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  
  useEffect(() => {
    customFetch("/api/cases").then(res => res && setCases(res));
    customFetch("/api/funds").then(res => res && setFunds(res));
  }, []);

  const totalFunded = cases.filter(c => c.status === "funded" || c.status === "closed").length;
  const activeCases = cases.filter(c => c.status === "active" || c.status === "published").length;
  const impactData = [
    { name: "يناير", amount: 12000 },
    { name: "فبراير", amount: 15000 },
    { name: "مارس", amount: 22000 },
    { name: "أبريل", amount: 18000 },
    { name: "مايو", amount: 35000 }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            {lang === 'ar' ? 'لوحة تحليلات التأثير للجهات الخيرية' : 'Charity Impact Analytics'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">تتبع الأداء، قياس الأثر، وتوجيه الدعم بناءً على البيانات</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" /> 
          {lang === 'ar' ? 'تصدير التقرير' : 'Export Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">الحالات المنجزة</span>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black">{totalFunded}</div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">+12% هذا الشهر</div>
        </div>
        
        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">المستفيدون النشطون</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black">{activeCases}</div>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">المشاريع المدعومة</span>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black">14</div>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">معدل الاستجابة</span>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black">94%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className="font-bold mb-4">نمو التبرعات والتأثير (شهرياً)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={impactData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className="font-bold mb-4">توزيع المساعدات حسب القطاع</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { category: 'صحي', value: 45 },
                { category: 'تعليمي', value: 30 },
                { category: 'إعاشة', value: 65 },
                { category: 'إسكان', value: 20 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="category" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
