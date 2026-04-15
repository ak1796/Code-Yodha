import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle, Clock, ArrowUpRight, 
  ShieldAlert, Search, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SLABreachManager() {
  const { t } = useTranslation();
  const [breaches, setBreaches] = useState([
    { id: '1088', category: 'WATER', officer: 'Ramesh Sharma', overdue: 14, escalated: false },
    { id: '1091', category: 'ROADS', officer: 'Priya Sharma', overdue: 9, escalated: true },
    { id: '1103', category: 'GARBAGE', officer: 'Suresh Patil', overdue: 2, escalated: false },
    { id: '1120', category: 'ELECTRICITY', officer: 'Raj Malhotra', overdue: 28, escalated: true },
  ]);

  const escalate = (id) => {
    setBreaches(prev => prev.map(b => b.id === id ? { ...b, escalated: true } : b));
    toast.promise(
       new Promise(resolve => setTimeout(resolve, 1500)),
       {
          loading: `Escalating Ticket #${id} to Department Head...`,
          success: `Ticket #${id} Reassigned to Specialist Supervisor`,
          error: 'Escalation Node Collision',
       }
    );
  };

  const resolveLocally = (id) => {
    setBreaches(prev => prev.filter(b => b.id !== id));
    toast.success(`Ticket #${id} fulfilled & removed from breach list`);
  };

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
       <header className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-soft border border-border">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-crimson text-white flex items-center justify-center shadow-xl shadow-crimson/20 pulse-sm">
                <AlertTriangle size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-sora font-extrabold text-navy tracking-tight uppercase">{t('BreachManagement')}</h1>
                <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-[0.3em] mt-1 italic">{t('EscalationGridDesc')}</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-bg px-6 py-4 rounded-2xl border border-border flex flex-col items-end">
                <span className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">{t('GlobalBreaches')}</span>
                <span className="text-2xl font-sora font-black text-crimson tabular-nums">{t('ActiveNodes', { count: breaches.length })}</span>
             </div>
          </div>
       </header>

       <div className="bg-white rounded-[3.5rem] shadow-soft border border-border overflow-hidden">
          <div className="p-10 border-b border-border flex justify-between items-center bg-bg/50">
             <div className="relative w-full max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy opacity-30" />
                <input 
                  type="text" 
                  placeholder={t('SearchDirectory')}
                  className="w-full bg-white border border-border rounded-2xl pl-12 pr-6 py-4 text-xs font-bold uppercase tracking-widest text-navy focus:ring-2 ring-navy/10 outline-none"
                />
             </div>
          </div>

          <table className="w-full text-left">
             <thead>
                <tr className="border-b border-border bg-white">
                   <Th label="Overdue Ticket" />
                   <Th label="Category" />
                   <Th label="Primary Specialist" />
                   <Th label="Breach Magnitude" />
                   <Th label="Escalation Status" />
                   <Th label="Tactical Intervention" />
                </tr>
             </thead>
             <tbody className="divide-y divide-border">
                {breaches.length > 0 ? breaches.map(b => (
                  <tr key={b.id} className="hover:bg-bg/50 transition-all group">
                     <td className="py-8 px-10">
                        <span className="text-sm font-extrabold text-navy uppercase tracking-tighter">UGIRP-{b.id}</span>
                     </td>
                     <td className="py-8">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-navy/60">{b.category}</span>
                     </td>
                     <td className="py-8">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center font-black text-[10px] text-navy">
                              {b.officer.charAt(0)}
                           </div>
                           <span className="text-xs font-bold text-navy opacity-80">{b.officer}</span>
                        </div>
                     </td>
                     <td className="py-8">
                        <div className="flex items-center gap-2">
                           <Clock size={14} className="text-crimson" />
                           <span className="text-sm font-sora font-black text-crimson tabular-nums">{b.overdue}h Overdue</span>
                        </div>
                     </td>
                     <td className="py-8">
                        {b.escalated ? (
                           <div className="flex items-center gap-2 px-3 py-1 bg-crimson text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-crimson/20 animate-pulse">
                              <ShieldAlert size={12} /> ESCALATED TO HEAD
                           </div>
                        ) : (
                           <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-border">
                              <ArrowUpRight size={12} /> PENDING REVIEW
                           </div>
                        )}
                     </td>
                     <td className="py-8 px-10">
                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => escalate(b.id)}
                             disabled={b.escalated}
                             className="p-3 bg-navy text-white hover:bg-crimson rounded-xl transition shadow-xl disabled:opacity-20 disabled:grayscale" 
                             title="Escalate Ticket"
                           >
                              <ShieldAlert size={16} />
                           </button>
                           <button 
                             onClick={() => resolveLocally(b.id)}
                             className="p-3 bg-emerald text-white hover:scale-110 rounded-xl transition shadow-xl" 
                             title="Force Resolve Node"
                           >
                              <CheckCircle size={16} />
                           </button>
                        </div>
                     </td>
                  </tr>
                )) : (
                  <tr>
                     <td colSpan={6} className="py-32 text-center opacity-40">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                           <CheckCircle size={40} className="text-emerald" />
                        </div>
                        <h4 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">Strategic Compliance 100%</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-2">No active SLA breaches detected in jurisdictional grid.</p>
                     </td>
                  </tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function Th({ label }) {
   return <th className="py-6 px-10 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 italic">{label}</th>;
}
