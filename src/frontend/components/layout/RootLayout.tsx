import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Outlet />
    </div>
  );
}
