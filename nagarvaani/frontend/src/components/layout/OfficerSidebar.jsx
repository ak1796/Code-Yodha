import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import {
  LogOut, Activity, Users, Shield, Database, LayoutDashboard,
  ToggleRight, ToggleLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OfficerSidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(profile?.is_available ?? true);
  const { t, i18n } = useTranslation();

  const toggleAvailability = async () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: nextVal })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success(nextVal ? "Field status: ACTIVE" : "Field status: AWAY");
    } catch (err) {
      toast.error("Sync failed");
      setIsOnline(!nextVal);
    }
  };

  const menuItems = [
    { icon: <LayoutDashboard size={22} />, labelKey: "OperationalHub", path: "/officer/dashboard" },
    { icon: <Activity size={22} />, labelKey: "LiveIngestion", path: "/officer/ingestion" },
    { icon: <Database size={22} />, labelKey: "CivicPerformance", path: "/officer/performance" },
    { icon: <Shield size={22} />, labelKey: "SovereignAudit", path: "/officer/audit" },
  ];

  return (
    <aside className="w-20 lg:w-72 bg-navy text-white flex flex-col items-center lg:items-start transition-all duration-300 z-50 fixed lg:static h-screen border-r border-white/5">
      <div className="p-8 py-12 lg:px-10 text-2xl font-sora font-extrabold flex flex-col gap-1 w-full bg-navy relative">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-saffron animate-pulse" />
            <span className="text-white hidden lg:block tracking-tighter">NagarVaani</span>
         </div>
         <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold hidden lg:block mt-4">{t('FieldCommandStation')}</span>
      </div>

      {/* Language Selector */}
      <div className="px-6 pb-4 w-full hidden lg:block">
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

      <nav className="flex-1 p-6 w-full py-8 space-y-6">
         {menuItems.map((item) => (
           <div
             key={item.path}
             onClick={() => navigate(item.path)}
             className={`flex items-center gap-5 px-6 py-5 rounded-[1.5rem] cursor-pointer transition-all duration-300 relative group overflow-hidden ${
               location.pathname === item.path ? 'bg-navy-light text-saffron shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'
             }`}
           >
              {location.pathname === item.path && <div className="absolute left-0 top-0 h-full w-1.5 bg-saffron" />}
              <div className={`${location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{item.icon}</div>
              <span className="font-extrabold text-xs hidden lg:block uppercase tracking-[0.2em]">{t(item.labelKey)}</span>
           </div>
         ))}
      </nav>

      <div className="p-8 w-full border-t border-white/5 space-y-4">
         <div
           onClick={toggleAvailability}
           className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 ${isOnline ? 'bg-emerald/10 border border-emerald/20' : 'bg-crimson-light/10 border border-crimson/20'}`}
         >
            <div className="hidden lg:block">
               <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{t('Status')}</p>
               <p className={`text-[11px] font-extrabold mt-0.5 ${isOnline ? 'text-emerald' : 'text-crimson'}`}>
                  {isOnline ? t('ActiveInField') : t('AwayInactive')}
               </p>
            </div>
            {isOnline ? <ToggleRight className="text-emerald" size={28} /> : <ToggleLeft className="text-crimson" size={28} />}
         </div>

         <button onClick={signOut} className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/40 hover:bg-crimson hover:text-white transition w-full group">
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs hidden lg:block uppercase tracking-widest leading-none">{t('DeactivateTerminal')}</span>
         </button>
      </div>
    </aside>
  );
}
