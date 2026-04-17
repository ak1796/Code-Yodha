import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Bell, LogOut, LayoutDashboard, Database, 
  Settings, Shield, ChevronRight, Menu, Activity, TrendingUp 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NotificationPanel from '../officer/NotificationPanel';

export default function OfficerLayout({ children }) {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/officer/dashboard' },
    { icon: Database, label: 'SovereignAuditTitle', path: '/officer/audit' },
    { icon: Activity, label: 'Ingestion Feed', path: '/officer/ingestion' },
    { icon: TrendingUp, label: 'Performance Tracker', path: '/officer/performance' }
  ];

  const handleLogout = (e) => {
    e.preventDefault();
    signOut();
  };

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] font-sans">
      {/* Sidebar Navigation */}
      <aside className={`bg-white border-r border-border transition-all duration-500 overflow-hidden relative z-30 ${isSidebarOpen ? 'w-80' : 'w-24'}`}>
         <div className={`h-full flex flex-col py-8 ${isSidebarOpen ? 'px-8' : 'px-4 items-center'}`}>
            <div className={`flex items-center overflow-hidden mb-16 ${isSidebarOpen ? 'gap-4' : 'justify-center w-full'}`}>
               <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-navy/20">
                  <Shield size={20} className="text-saffron" />
               </div>
               <span className={`font-sora font-black text-lg text-navy tracking-tighter uppercase transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                  NagarVaani
               </span>
            </div>

            <nav className="flex-1 space-y-3 w-full">
               {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center py-4 rounded-2xl transition-all group ${
                        isActive 
                          ? 'bg-navy text-white shadow-xl shadow-navy/10' 
                          : 'text-text-secondary hover:bg-gray-50'
                      } ${isSidebarOpen ? 'px-6 gap-4' : 'px-0 justify-center mx-auto w-12 h-12'}`}
                    >
                       <item.icon size={20} className={isActive ? 'text-saffron' : 'group-hover:text-navy shrink-0'} />
                       <span className={`font-bold text-sm tracking-tight transition-opacity duration-300 whitespace-nowrap overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                          {t(item.label)}
                       </span>
                       {isActive && isSidebarOpen && <ChevronRight size={14} className="ml-auto opacity-40 shrink-0" />}
                    </Link>
                  );
               })}
               
               {/* Logout Button */}
               <button
                  onClick={handleLogout}
                  className={`w-full flex items-center py-4 rounded-2xl transition-all group text-crimson hover:bg-crimson/10 ${isSidebarOpen ? 'px-6 gap-4' : 'px-0 justify-center mx-auto w-12 h-12'}`}
               >
                  <LogOut size={20} className="shrink-0" />
                  <span className={`font-bold text-sm tracking-tight transition-opacity duration-300 whitespace-nowrap overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                     Logout
                  </span>
               </button>
            </nav>

            <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="mt-auto w-full flex items-center justify-center h-12 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
            >
               <Menu size={20} className="text-navy opacity-40" />
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
         <header className="h-28 bg-white/80 backdrop-blur-md border-b border-border px-10 flex items-center justify-between sticky top-0 z-20">
            <div>
               <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-[0.2em] mb-1">
                  {t('LastSynced', { time: '60s ago' })}
               </p>
               <h2 className="text-xl font-sora font-extrabold text-navy tracking-tight uppercase">
                  {navItems.find(n => n.path === location.pathname)?.label ? t(navItems.find(n => n.path === location.pathname).label) : t('SpecialistNode')}
               </h2>
            </div>

            <div className="flex items-center gap-6">
               <button
                 onClick={() => setShowNotifications(!showNotifications)}
                 className="relative p-3 hover:bg-gray-100 rounded-xl transition group"
               >
                  <Bell size={22} className="text-navy opacity-60 group-hover:opacity-100 transition" />
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-crimson rounded-full border-2 border-white" />
               </button>

               <div className="flex items-center gap-4 pl-6 border-l border-border">
                  <div className="text-right hidden sm:block">
                     <p className="text-sm font-black text-navy leading-none">{profile?.full_name}</p>
                     <p className="text-[10px] font-bold text-emerald uppercase tracking-tighter mt-1">{t(profile?.department)} {t('Specialist')}</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-navy text-white flex items-center justify-center font-black text-sm border-2 border-border shadow-xl shadow-navy/10 group hover:rotate-6 transition-transform">
                     {profile?.full_name?.charAt(0)}
                  </div>
               </div>

               <button 
                 onClick={signOut}
                 className="w-12 h-12 bg-gray-100/50 hover:bg-crimson text-navy/40 hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 border border-border group"
                 title="Sign Out"
               >
                  <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
               </button>
            </div>
         </header>

         <div className="relative overflow-y-auto h-[calc(100vh-7rem)]">
            {children}
         </div>
      </main>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}