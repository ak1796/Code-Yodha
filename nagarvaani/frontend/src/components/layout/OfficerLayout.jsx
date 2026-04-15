import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, LayoutDashboard, Zap, Activity, History, 
  Bell, LogOut, ShieldAlert, Award, Menu, X
} from 'lucide-react';
import NotificationPanel from '../officer/NotificationPanel';

export default function OfficerLayout({ children }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = 3;

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/officer/dashboard" },
    { icon: <Zap size={20} />, label: "Ingestion Feed", path: "/officer/ingestion" },
    { icon: <Award size={20} />, label: "Performance", path: "/officer/performance" },
    { icon: <History size={20} />, label: "Audit Log", path: "/officer/audit" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans antialiased text-navy overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-72 bg-navy text-white flex flex-col transition-all duration-300 z-50 fixed lg:static h-screen shadow-2xl">
         <div className="p-8 py-10 lg:px-10 flex flex-col gap-1 w-full relative">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center shadow-lg shadow-saffron/20 group hover:rotate-12 transition-transform border border-saffron/20">
                  <ShieldAlert size={24} />
               </div>
               <div className="hidden lg:block">
                  <h2 className="text-xl font-sora font-extrabold tracking-tighter leading-none">NagarVaani</h2>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mt-1 block italic">Officer Field Suite</span>
               </div>
            </div>
         </div>
         
         <nav className="flex-1 p-6 w-full space-y-2 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <div 
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                  location.pathname === item.path ? 'bg-white/10 text-saffron shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                 {location.pathname === item.path && <div className="absolute left-0 top-0 h-full w-1 bg-saffron shadow-[0_0_15px_#E8720C]" />}
                 <div className={`${location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'} transition-transform shrink-0`}>
                    {item.icon}
                 </div>
                 <span className="font-bold text-[11px] hidden lg:block uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
         </nav>

         <div className="p-8 border-t border-white/5 space-y-6">
            <button onClick={signOut} className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/20 hover:bg-crimson hover:text-white transition w-full group">
               <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
               <span className="font-bold text-[11px] hidden lg:block uppercase tracking-widest">Sign Out</span>
            </button>
         </div>
      </aside>

      {/* Main Command Center */}
      <main className="flex-1 overflow-y-auto relative h-screen scrollbar-hide">
         {/* Global Tactical Header */}
         <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-8 lg:px-12 py-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-6">
               <div className="px-4 py-2 bg-navy text-white text-[10px] font-black rounded-xl shadow-lg uppercase tracking-widest">
                  {profile?.department} SPECIALIST
               </div>
               <div className="flex items-center gap-3 px-4 py-2 bg-emerald-light/10 border border-emerald/10 rounded-xl">
                  <div className="w-2 h-2 bg-emerald rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-emerald uppercase tracking-widest leading-none mt-0.5">Tactical Pulse: Online</span>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <button 
                 onClick={() => setShowNotifications(true)}
                 className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center relative group border border-border transition-colors hover:bg-white"
               >
                  <Bell size={20} className="text-navy transition-transform group-hover:rotate-12" />
                  {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-crimson border-4 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                        {unreadCount}
                     </span>
                  )}
               </button>

               <div className="flex items-center gap-4 pl-6 border-l border-border hidden sm:flex">
                  <div className="text-right">
                     <p className="text-[11px] font-black text-navy uppercase tracking-tighter leading-none">{profile?.full_name}</p>
                     <p className="text-[9px] font-black text-text-secondary opacity-40 uppercase tracking-widest mt-1">Status: Active Field</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center font-black text-sm border border-navy/10">
                     {profile?.full_name?.charAt(0)}
                  </div>
               </div>
            </div>
         </header>

         <div className="relative">
            {children}
         </div>
      </main>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}
