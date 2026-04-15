import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeTickets } from '../../hooks/useRealtimeTickets';
import { useTranslation } from 'react-i18next';
import OfficerTicketCard from '../../components/officer/OfficerTicketCard';
import {
  BarChart3, CheckCircle, AlertCircle, TrendingUp,
  Search, Filter, Bell, LogOut, ChevronDown, Plus, RefreshCw, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import NotificationPanel from '../../components/officer/NotificationPanel';

export default function OfficerDashboard() {
  const { profile, signOut } = useAuth();
  const { tickets, loading, stats: realtimeStats } = useRealtimeTickets(profile?.id);
  const [filter, setFilter] = useState('active');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const { t } = useTranslation();

  const filteredTickets = useMemo(() => {
    let base = tickets;
    if (filter === 'breached') {
      base = tickets.filter(t => new Date(t.sla_deadline) < new Date() && t.status !== 'resolved');
    } else if (filter === 'active') {
      base = tickets.filter(t => t.status !== 'resolved' && new Date(t.sla_deadline) >= new Date());
    } else if (filter === 'resolved') {
      base = tickets.filter(t => t.status === 'resolved');
    }

    return [...base].sort((a, b) => {
      if ((b.priority_score >= 4) !== (a.priority_score >= 4)) {
        return (b.priority_score >= 4) ? 1 : -1;
      }
      return new Date(a.sla_deadline) - new Date(b.sla_deadline);
    });
  }, [tickets, filter]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-8 lg:p-12 animate-fade-in relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Header */}
        <header className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-soft border border-border">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-navy text-white flex items-center justify-center font-sora font-extrabold text-2xl shadow-xl shadow-navy/20 uppercase tracking-tighter">
                 {profile?.department?.charAt(0)}
              </div>
              <div>
                 <h1 className="text-3xl font-sora font-extrabold text-navy tracking-tight">{profile?.full_name}</h1>
                 <div className="flex items-center gap-3 mt-1.5">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[9px] font-extrabold rounded-full uppercase tracking-widest border border-blue-200">
                       {profile?.department} {t('Specialist')}
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest">
                       {t('Ward')}: {profile?.ward_name || 'Mumbai HQ'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-6">
                 <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40">{t('TacticalPulse')}</span>
                 <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-emerald-light/20 rounded-full border border-emerald/10">
                    <div className="w-2 h-2 bg-emerald rounded-full animate-pulse shadow-[0_0_8px_#10B981]" />
                    <span className="text-[9px] font-extrabold text-emerald uppercase tracking-widest italic">{t('LiveSyncActive')}</span>
                 </div>
              </div>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-white transition shadow-sm relative group border border-border"
              >
                 <Bell size={24} className="text-navy group-hover:rotate-12 transition" />
                 {unreadCount > 0 && (
                    <div className="absolute top-4 right-4 w-5 h-5 bg-crimson rounded-full flex items-center justify-center border-4 border-white">
                       <span className="text-[8px] font-black text-white">{unreadCount}</span>
                    </div>
                 )}
              </button>

              <button
                onClick={signOut}
                className="w-14 h-14 bg-navy text-white rounded-2xl flex items-center justify-center hover:bg-crimson transition shadow-xl group border border-transparent"
              >
                 <LogOut size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
           </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <StatsCard label={t('AssignedToday')} value={realtimeStats.assignedToday} icon={<Plus size={22} />} color="navy" />
           <StatsCard label={t('ResolvedToday')} value={realtimeStats.resolvedToday} icon={<CheckCircle size={22} />} color="emerald" />
           <StatsCard label={t('SLABreaches')} value={realtimeStats.breaches} icon={<AlertCircle size={22} />} color="crimson" pulse={realtimeStats.breaches > 0} />
           <StatsCard label={t('PerformanceScore')} value={`${realtimeStats.performance}%`} icon={<TrendingUp size={22} />} color="saffron" sub="Grade: Elite" />
        </div>

        {/* Ticket Area */}
        <div className="space-y-8">
           <div className="flex justify-between items-end border-b border-border pb-6">
              <div className="flex gap-1 bg-white p-1.5 rounded-2xl shadow-soft border border-border">
                 <Tab label={t('Active')} active={filter === 'active'} count={tickets.filter(t => t.status !== 'resolved').length} onClick={() => setFilter('active')} />
                 <Tab label={t('Breached')} active={filter === 'breached'} count={realtimeStats.breaches} onClick={() => setFilter('breached')} variant="red" />
                 <Tab label={t('Resolved')} active={filter === 'resolved'} count={tickets.filter(t => t.status === 'resolved').length} onClick={() => setFilter('resolved')} />
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {loading ? (
                 <div className="py-20 text-center opacity-20">
                    <RefreshCw className="animate-spin text-navy mx-auto mb-4" size={48} />
                    <p className="font-bold uppercase tracking-widest text-xs">{t('SynchronizingQueue')}</p>
                 </div>
              ) : filteredTickets.length > 0 ? (
                 filteredTickets.map((ticket, index) => (
                    <OfficerTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      isNew={index === 0 && new Date() - new Date(ticket.created_at) < 60000}
                    />
                 ))
              ) : (
                 <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-border opacity-40">
                    <CheckCircle size={64} className="mx-auto mb-4 text-emerald" />
                    <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('QueueClear')}</h3>
                    <p className="text-xs font-bold uppercase tracking-widest mt-2">{t('AllNodesFulfilled')}</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}

function StatsCard({ label, value, icon, color, pulse, sub }) {
   const colors = {
      navy: 'bg-navy text-white shadow-navy/20',
      emerald: 'bg-emerald text-white shadow-emerald/20',
      crimson: 'bg-crimson text-white shadow-crimson/20',
      saffron: 'bg-white text-navy border-2 border-saffron shadow-saffron/10'
   };
   return (
      <div className={`p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between transition-all duration-500 hover:-translate-y-2 group ${colors[color]} ${pulse ? 'animate-pulse ring-8 ring-crimson/10' : ''}`}>
         <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-1 leading-none">{label}</p>
            <h3 className="text-4xl font-sora font-extrabold tracking-tighter uppercase">{value}</h3>
            {sub && <p className="text-[9px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 bg-saffron text-white rounded-full inline-block">{sub}</p>}
         </div>
         <div className={`w-14 h-14 transition-transform group-hover:scale-110 flex items-center justify-center rounded-2xl ${color === 'saffron' ? 'bg-saffron text-white' : 'bg-white/10'}`}>
            {icon}
         </div>
      </div>
   );
}

function Tab({ label, active, count, onClick, variant }) {
   return (
      <button
        onClick={onClick}
        className={`px-8 py-4 rounded-xl font-sora font-extrabold text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 ${
          active ? 'bg-navy text-white shadow-xl' : 'hover:bg-gray-50 text-text-secondary opacity-60'
        }`}
      >
         {label}
         {count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
               active ? 'bg-white text-navy' : (variant === 'red' ? 'bg-crimson text-white' : 'bg-navy text-white')
            }`}>
               {count}
            </span>
         )}
      </button>
   );
}
