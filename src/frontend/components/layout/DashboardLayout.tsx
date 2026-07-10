import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, Home, Users, Heart, PieChart, Briefcase, Settings, X, Moon, Sun, Stethoscope, FileText } from 'lucide-react';
import { useAppStore } from '../../stores/useStore';

export default function DashboardLayout() {
  const { theme, setTheme, isSidebarOpen, setSidebarOpen } = useAppStore();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navItems = [
    { to: "/", icon: <Home size={20} />, label: "الرئيسية" },
    { to: "/citizen", icon: <Users size={20} />, label: "بوابة المواطن" },
    { to: "/donor", icon: <Heart size={20} />, label: "بوابة المتبرع" },
    { to: "/charity", icon: <Briefcase size={20} />, label: "بوابة الجمعيات" },
    { to: "/researcher", icon: <FileText size={20} />, label: "بوابة الباحث" },
    { to: "/medical", icon: <Stethoscope size={20} />, label: "البوابة الطبية" },
    { to: "/ledger", icon: <PieChart size={20} />, label: "مركز الشفافية" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">تكامل</span>
          <button className="md:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <NavItem to="/settings" icon={<Settings size={20} />} label="الإعدادات" onClick={() => setSidebarOpen(false)} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              م
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, onClick }: any) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
