import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Map, ShieldAlert, Users, Zap, Brain,
  Search, AlertTriangle, BarChart3, LogOut, EyeOff, History, X
} from 'lucide-react';

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, labelKey: "GlobalHUD", path: "/admin/dashboard" },
    { icon: <Map size={20} />, labelKey: "LiveHeatmap", path: "/admin/heatmap" },
    { icon: <ShieldAlert size={20} />, labelKey: "AATSTrust", path: "/admin/trust" },
    { icon: <Users size={20} />, labelKey: "OfficerRoster", path: "/admin/officers" },
    { icon: <Brain size={20} />, labelKey: "DailyInsights", path: "/admin/insights" },
    { icon: <History size={20} />, labelKey: "CivicMemory", path: "/admin/civic-memory" },
    { icon: <EyeOff size={20} />, labelKey: "SilentCrises", path: "/admin/silent" },
    { icon: <Search size={20} />, labelKey: "AuditExplorer", path: "/admin/audit" },
    { icon: <AlertTriangle size={20} />, labelKey: "SLABreachesMenu", path: "/admin/breaches" },
    { icon: <BarChart3 size={20} />, labelKey: "Analytics", path: "/admin/analytics" },
  ];

  const handleNav = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[55] transition-opacity duration-500 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`w-80 bg-navy-dark text-white flex flex-col fixed inset-y-0 left-0 z-[60] transition-all duration-500 ease-in-out border-r border-white/5 shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 py-10 lg:px-10 flex justify-between items-center w-full relative">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-crimson flex items-center justify-center shadow-lg shadow-crimson/20">
                 <ShieldAlert size={24} className="text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-sora font-extrabold tracking-tighter leading-none">NagarVaani</h2>
                 <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mt-1 block">{t('GlobalHQ')}</span>
              </div>
           </div>
           <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition text-white/50 hover:text-white">
              <X size={20} />
           </button>
        </div>

        {/* Language Selector */}
        <div className="px-8 pb-4">
          <select
            className="w-full bg-white/10 text-white text-[10px] font-bold uppercase outline-none cursor-pointer tracking-widest rounded-lg px-3 py-2 border border-white/10"
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            value={i18n.language}
          >
            <option value="en" className="bg-navy">English</option>
            <option value="hi" className="bg-navy">हिंदी</option>
            <option value="mr" className="bg-navy">मराठी</option>
            <option value="bn" className="bg-navy">বাংলা</option>
            <option value="ta" className="bg-navy">தமிழ்</option>
            <option value="ml" className="bg-navy">മലയാളം</option>
          </select>
        </div>

        <nav className="flex-1 p-6 w-full space-y-2 overflow-y-auto scrollbar-hide">
           {menuItems.map((item) => (
             <div
               key={item.path}
               onClick={() => handleNav(item.path)}
             className={`flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden ${
               location.pathname === item.path ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md' : 'text-white/60 hover:bg-white/5 hover:text-white'
             }`}
           >
              {location.pathname === item.path && <div className="absolute left-0 top-0 h-full w-1 bg-crimson shadow-[0_0_15px_#C0392B]" />}
              <div className={`${location.pathname === item.path ? 'scale-110 text-crimson-light' : 'group-hover:scale-110'} transition-transform shrink-0`}>
                 {item.icon}
              </div>
              <span className="font-bold text-[11px] hidden lg:block uppercase tracking-widest">{t(item.labelKey)}</span>
           </div>
         ))}
      </nav>

      <div className="p-8 w-full border-t border-white/5">
         <div className="flex items-center gap-3 mb-8 px-2 hidden lg:flex">
            <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-extrabold text-sm border border-white/10">
               {profile?.full_name?.charAt(0)}
            </div>
            <div>
               <p className="text-[11px] font-extrabold tracking-tight">{profile?.full_name}</p>
               <span className="px-2 py-0.5 bg-crimson text-[8px] font-extrabold rounded-full uppercase tracking-tighter">{t('SystemAdmin')}</span>
            </div>
         </div>
         <button onClick={signOut} className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/40 hover:bg-crimson hover:text-white transition w-full group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-[11px] hidden lg:block uppercase tracking-widest leading-none">{t('TerminateSession')}</span>
         </button>
      </div>
      </aside>
    </>
  );
}
