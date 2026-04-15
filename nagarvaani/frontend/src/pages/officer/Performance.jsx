import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, CheckCircle, Clock, Star,
  ArrowUpRight, ArrowDownRight, Award, Zap, ShieldCheck, MapPin
} from 'lucide-react';

const MOCK_BAR_DATA = [
  { day: 'Mon', resolved: 3 },
  { day: 'Tue', resolved: 2 },
  { day: 'Wed', resolved: 4 },
  { day: 'Thu', resolved: 1 },
  { day: 'Fri', resolved: 4 },
  { day: 'Sat', resolved: 2 },
  { day: 'Sun', resolved: 1 },
];

export default function Performance() {
  const { profile } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
    const sub = supabase.channel('perf-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'master_tickets' }, fetchHistory)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('master_tickets')
      .select('*')
      .eq('assigned_to', profile?.id)
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false });
    setHistory(data || []);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-8 lg:p-16 animate-fade-in pb-32">
       <div className="max-w-7xl mx-auto space-y-12">
          
          <header className="flex justify-between items-end">
             <div className="space-y-2">
                <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight">{t('PerformanceCockpit')}</h1>
                <p className="text-text-secondary font-medium opacity-60 italic">{t('PerformanceCockpitDesc')}</p>
             </div>
             <div className="bg-white px-8 py-4 rounded-3xl shadow-soft border border-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center shadow-lg shadow-saffron/20">
                   <Award size={20} />
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{t('OperationalRank')}</span>
                   <p className="text-sm font-extrabold text-navy uppercase tracking-tighter">{t('GoldSpecialistTier')}</p>
                </div>
             </div>
          </header>

          {/* KPI Matrix (4 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <KPICard label={t('JurisdictionsClosed')} val="14" sub={t('ThisWeek')} icon={<CheckCircle size={24}/>} color="emerald" />
             <KPICard label={t('AvgResolutionTime')} val="38.2h" sub={t('ResolutionDeltaWindow')} icon={<Clock size={24}/>} color="navy" trend="down" />
             <KPICard label={t('SLACompliance')} val="86.4%" sub="Grade: A+" icon={<ShieldCheck size={24}/>} color="saffron" trend="up" />
             <KPICard label={t('CitizenSentiment')} val="4.2" sub={t('VoterTrust')} icon={<Star size={24}/>} color="crimson" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             {/* Weekly Velocity Chart */}
             <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-12 shadow-soft border border-border relative overflow-hidden group">
                <div className="flex justify-between items-center mb-12">
                   <div>
                      <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('ResolutionVelocity')}</h3>
                      <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest mt-1">{t('RollingRollingLoad')}</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald">
                         <div className="w-2 h-2 rounded-full bg-emerald" /> {t('Volume')}
                      </div>
                   </div>
                </div>
                <div className="h-[350px] relative z-10">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_BAR_DATA}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                         <Tooltip 
                           contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                           cursor={{fill: '#f8f9fc'}}
                         />
                         <Bar dataKey="resolved" fill="#0D1B40" radius={[12, 12, 12, 12]} barSize={40}>
                            {MOCK_BAR_DATA.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 4 ? '#E8720C' : '#0D1B40'} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-navy/5 rounded-full blur-[100px] transition-transform group-hover:scale-125 duration-1000" />
             </div>

             {/* Personal Milestone Card */}
             <div className="lg:col-span-4 bg-navy rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                   <h3 className="text-xl font-sora font-extrabold uppercase tracking-tight text-saffron mb-6">{t('TacticalPeak')}</h3>
                   <p className="text-sm font-medium opacity-60 leading-relaxed mb-10">{t('MandatoryQuotaSuccess')}</p>
                   
                   <div className="space-y-6">
                      <ProgressItem label={t('WaterRestoration')} val={92} />
                      <ProgressItem label={t('InfrastructureSafety')} val={78} />
                   </div>
                </div>
                
                <button className="relative z-10 w-full bg-white/10 backdrop-blur-md border border-white/20 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition">
                   {t('GlobalLeaderboard')}
                </button>
                
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-saffron/10 rounded-full blur-[80px]" />
             </div>
          </div>

          {/* Fulfillment History Table */}
          <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border">
             <div className="flex justify-between items-center mb-12">
                <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('ForensicFulfillmentLog')}</h3>
                <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest italic">{history.length} {t('NodesArchived')}</span>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="border-b border-border">
                         <TableHead label={t('NodeID')} />
                         <TableHead label={t('Category')} />
                         <TableHead label={t('ResolutionTime')} />
                         <TableHead label={t('TrustRating')} />
                         <TableHead label={t('SLAStatus')} />
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {history.map(ticket => (
                         <tr key={ticket.id} className="hover:bg-bg/50 transition-colors">
                            <td className="py-6 font-bold text-navy text-sm uppercase tracking-tighter">UGIRP-{ticket.id.substring(0, 5)}</td>
                            <td className="py-6">
                               <span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-navy/60">{ticket.category}</span>
                            </td>
                            <td className="py-6 font-medium text-navy/80 text-sm italic">34.2 hours</td>
                            <td className="py-6">
                               <div className="flex items-center gap-1 text-saffron">
                                  <Star size={12} fill="currentColor" />
                                  <Star size={12} fill="currentColor" />
                                  <Star size={12} fill="currentColor" />
                                  <Star size={12} fill="currentColor" />
                                  <Star size={12} className="opacity-20" />
                               </div>
                            </td>
                            <td className="py-6">
                               <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${new Date(ticket.resolved_at) < new Date(ticket.sla_deadline) ? 'bg-emerald' : 'bg-crimson'}`} />
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${new Date(ticket.resolved_at) < new Date(ticket.sla_deadline) ? 'text-emerald' : 'text-crimson'}`}>
                                     {new Date(ticket.resolved_at) < new Date(ticket.sla_deadline) ? t('StandardMet') : t('Breached')}
                                  </span>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );
}

function KPICard({ label, val, sub, icon, color, trend }) {
   const colors = {
      emerald: 'text-emerald bg-emerald-light/10',
      navy: 'text-navy bg-navy/5',
      saffron: 'text-saffron bg-saffron-light/10',
      crimson: 'text-crimson bg-crimson-light/10'
   };
   return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-border group hover:-translate-y-2 transition-transform duration-500">
         <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl transition-transform group-hover:rotate-12 ${colors[color]}`}>
               {icon}
            </div>
            {trend && (
               <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black ${trend === 'up' ? 'bg-emerald-light/30 text-emerald' : 'bg-crimson-light/30 text-crimson'}`}>
                  {trend === 'up' ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                  {trend === 'up' ? 'Trending' : '-12%'}
               </div>
            )}
         </div>
         <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 mb-1 block">{label}</span>
            <h4 className="text-3xl font-sora font-extrabold text-navy tracking-tighter">{val}</h4>
            <p className="text-[9px] font-bold text-text-secondary opacity-60 uppercase tracking-widest mt-2 italic">{sub}</p>
         </div>
      </div>
   );
}

function ProgressItem({ label, val }) {
   return (
      <div className="space-y-2">
         <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
            <span>{label}</span>
            <span className="text-white">{val}%</span>
         </div>
         <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-saffron" style={{ width: `${val}%` }} />
         </div>
      </div>
   );
}

function TableHead({ label }) {
   return <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{label}</th>;
}
