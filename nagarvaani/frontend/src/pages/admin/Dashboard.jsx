import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3, CheckCircle, AlertTriangle, Users,
  Activity, Clock, TrendingUp, ShieldCheck, Zap,
  Smartphone, Globe, MessageSquare, ChevronRight, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';

const MOCK_LINE_DATA = [
  { time: '09:00', volume: 42 },
  { time: '10:00', volume: 55 },
  { time: '11:00', volume: 89 },
  { time: '12:00', volume: 65 },
  { time: '13:00', volume: 45 },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total: 247,
    resolved: 89,
    breaches: 12,
    avgTime: 31,
    activeOfficers: 18,
    health: 'GREEN'
  });

  useEffect(() => {
    const subscription = supabase
      .channel('global-pulse')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'master_tickets' }, (payload) => {
        setStats(prev => ({ ...prev, total: prev.total + 1 }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'master_tickets' }, (payload) => {
        if (payload.new.status === 'resolved' && payload.old.status !== 'resolved') {
           setStats(prev => ({ ...prev, resolved: prev.resolved + 1 }));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
       <header className="flex justify-between items-end">
          <div className="space-y-2">
             <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-4">
                <ShieldCheck className="text-navy opacity-20" size={40} /> {t('StrategicHQ')}
             </h1>
             <p className="text-text-secondary font-medium opacity-60 italic">{t('GlobalCommandInterface')}</p>
          </div>
          <div className="bg-bg px-6 py-4 rounded-3xl border border-border flex items-center gap-4 shadow-sm">
             <div className="w-2 h-2 bg-emerald rounded-full animate-pulse shadow-[0_0_10px_#10B981]" />
             <span className="text-[10px] font-black uppercase tracking-widest text-navy">{t('NodeConnection')}</span>
          </div>
       </header>

       {/* Stats Row */}
       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatCard label={t('ComplaintsToday')} val={stats.total} icon={<Zap size={20}/>} color="navy" sub={t('SincLastSync')} />
          <StatCard label={t('ResolvedTodayLabel')} val={stats.resolved} icon={<CheckCircle size={20}/>} color="emerald" sub="35.2% efficiency" />
          <StatCard label={t('SLABreachesLabel')} val={stats.breaches} icon={<AlertTriangle size={20}/>} color="crimson" pulse />
          <StatCard label={t('AvgResolution')} val={`${stats.avgTime}h`} icon={<Clock size={20}/>} color="navy" />
          <StatCard label={t('OfficersActive')} val={`${stats.activeOfficers}/24`} icon={<Users size={20}/>} color="navy" />
          <StatCard label={t('SystemHealth')} val={stats.health} icon={<ShieldCheck size={20}/>} color="emerald" highlight />
       </div>

       {/* Chart + Distribution */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-12 shadow-soft border border-border group relative overflow-hidden">
             <div className="flex gap-4 items-center border-border">
                <BarChart3 className="text-navy" size={40} />
                <div>
                  <h1 className="text-4xl font-sora font-black text-navy tracking-tighter uppercase leading-none">{t('GlobalUrbanPulse')}</h1>
                  <p className="text-[11px] font-bold text-text-secondary opacity-40 uppercase tracking-widest mt-1 italic">{t('IntelligenceHUD')}</p>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-navy">
                      <div className="w-2 h-2 rounded-full bg-navy" /> {t('NodeFlux')}
                   </div>
                </div>
             </div>
             <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={MOCK_LINE_DATA}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D1B40" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0D1B40" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                      <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="volume" stroke="#0D1B40" strokeWidth={4} fillOpacity={1} fill="url(#colorVolume)" dot={{r: 4, fill: '#0D1B40'}} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-4 bg-navy rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
             <div className="relative z-10 space-y-8">
                <h3 className="text-xl font-sora font-extrabold uppercase tracking-tight text-saffron">{t('SensorDistribution')}</h3>
                <div className="space-y-6">
                   <SourceItem icon={<Smartphone size={16}/>} label={t('AppWebNodes')} val="41%" color="bg-emerald" />
                   <SourceItem icon={<MessageSquare size={16}/>} label={t('TelegramBot')} val="18%" color="bg-blue-400" />
                   <SourceItem icon={<Globe size={16}/>} label={t('PublicSocial')} val="27%" color="bg-saffron" />
                   <SourceItem icon={<Activity size={16}/>} label={t('SilentNodes')} val="14%" color="bg-crimson" />
                </div>
             </div>
             <div className="pt-10 relative z-10 border-t border-white/10 italic text-[10px] font-medium opacity-40 leading-relaxed">
                Aggregating {stats.total} signals across 2,400 municipal ward nodes in real-time.
             </div>
             <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
          </div>
       </div>

       {/* Hotspots */}
       <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('HighPriorityHotspots')}</h3>
             <button className="text-[10px] font-black uppercase tracking-widest text-navy bg-bg px-6 py-2 rounded-xl hover:bg-navy hover:text-white transition">{t('ViewLiveMap')}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <HotspotCard loc="Kurla West" count="47" category="Water" status="Critical" nodesLabel={t('NodesActive')} />
             <HotspotCard loc="Dharavi Block 2" count="12" category="Garbage" status="Silent" nodesLabel={t('NodesActive')} />
             <HotspotCard loc="Andheri Node" count="31" category="Roads" status="Active" nodesLabel={t('NodesActive')} />
             <HotspotCard loc="Bandra East" count="6" category="Elec" status="Stable" nodesLabel={t('NodesActive')} />
          </div>
       </div>
    </div>
  );
}

function StatCard({ label, val, icon, color, pulse, sub, highlight }) {
   const colors = {
      navy: 'text-navy bg-navy/5',
      emerald: 'text-emerald bg-emerald-light/10',
      crimson: 'text-crimson bg-crimson-light/10 pulse-sm border border-crimson/20'
   };
   return (
      <div className="p-8 rounded-[2.5rem] bg-white border border-border shadow-soft group hover:-translate-y-2 transition-transform duration-500 overflow-hidden relative">
         <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-xl transition-transform group-hover:rotate-12 ${colors[color]}`}>
               {icon}
            </div>
            {highlight && <div className="w-2 h-2 bg-emerald rounded-full shadow-[0_0_10px_#10B981]" />}
         </div>
         <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary opacity-40 mb-1 block leading-none">{label}</span>
            <h4 className={`text-2xl font-sora font-black tracking-tighter ${color === 'crimson' ? 'text-crimson' : 'text-navy'}`}>{val}</h4>
            {sub && <p className="text-[8px] font-bold text-text-secondary opacity-60 uppercase tracking-widest mt-2">{sub}</p>}
         </div>
      </div>
   );
}

function SourceItem({ icon, label, val, color }) {
   return (
      <div className="flex items-center gap-4">
         <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color} text-white shadow-sm`}>
            {icon}
         </div>
         <div className="flex-1">
            <div className="flex justify-between items-center mb-1 text-[10px] font-black uppercase tracking-widest">
               <span className="opacity-40">{label}</span>
               <span>{val}</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <div className={`h-full ${color}`} style={{ width: val }} />
            </div>
         </div>
      </div>
   );
}

function HotspotCard({ loc, count, category, status, nodesLabel }) {
   return (
      <div className="p-6 rounded-3xl bg-bg border border-border hover:border-navy/20 transition-all cursor-pointer">
         <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-navy uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">{category}</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'Critical' ? 'text-crimson' : 'text-navy/40'}`}>{status}</span>
         </div>
         <h4 className="text-sm font-extrabold text-navy tracking-tight mb-2 uppercase">{loc}</h4>
         <div className="flex items-end gap-2">
            <span className="text-2xl font-sora font-black text-navy tracking-tighter">{count}</span>
            <span className="text-[9px] font-bold text-navy opacity-20 uppercase tracking-widest mb-1.5">{nodesLabel}</span>
         </div>
      </div>
   );
}
