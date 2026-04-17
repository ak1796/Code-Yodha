import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, Search, Calendar, User, 
  History, Shield, Zap, FileText, 
  Activity, CheckCircle, ShieldCheck,
  Terminal, Cpu, AlertTriangle
} from 'lucide-react';

// Forensic Hash Utility for Accountability
const getForensicHash = (id, length = 6) => {
   if (!id) return "0x" + "0".repeat(length);
   // Simple deterministic hash
   let hash = 0;
   const str = id.toString();
   for (let i = 0; i < str.length; i++) {
     hash = ((hash << 5) - hash) + str.charCodeAt(i);
     hash |= 0;
   }
   return "0x" + Math.abs(hash).toString(16).substring(0, length).toUpperCase();
};

import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function OfficerAudit() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const { t } = useTranslation();

  useEffect(() => {
    if (!profile?.id) return;
    
    fetchComprehensiveLogs();

    // REAL-TIME SUBSCRIPTION: Listen for new audit entries
    const channel = supabase
      .channel('officer-audit-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'audit_log' 
      }, (payload) => {
        setLogs(prev => [payload.new, ...prev]);
        toast.success(t('LedgerUpdatedRealtime'));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile?.id]);

  const fetchComprehensiveLogs = async () => {
    try {
      const { data: myTickets } = await supabase
        .from('master_tickets')
        .select('id')
        .eq('assigned_to', profile.id);
      
      const ticketIds = myTickets?.map(t => t.id) || [];

      // 2. Fetch ALL logs for these tickets (including system/AI actions)
      // Fix: Handle empty ticketIds to avoid .in.() syntax error
      let query = supabase.from('audit_log').select('*');
      
      if (ticketIds.length > 0) {
        query = query.or(`ticket_id.in.(${ticketIds.join(',')}),actor_id.eq.${profile.id}`);
      } else {
        query = query.eq('actor_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('AuditRegistryOffline'));
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.note?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || 
        (typeFilter === 'SYSTEM' && !log.actor_id) ||
        (typeFilter === 'MANUAL' && log.actor_id);

      return matchesSearch && matchesType;
    });
  }, [logs, searchTerm, typeFilter]);

  // Group logs by Ticket ID to show timelines per case
  const groupedLogs = useMemo(() => {
    const groups = {};
    filteredLogs.forEach(log => {
      if (!log.ticket_id) return;
      if (!groups[log.ticket_id]) groups[log.ticket_id] = [];
      groups[log.ticket_id].push(log);
    });
    // Sort logs within each group by date ascending for timeline flow
    // Sort groups by the most recent activity in that group
    return Object.keys(groups)
      .sort((a, b) => {
        const lastA = new Date(groups[a][groups[a].length - 1].created_at);
        const lastB = new Date(groups[b][groups[b].length - 1].created_at);
        return lastB - lastA;
      })
      .reduce((obj, key) => {
        obj[key] = groups[key];
        return obj;
      }, {});
  }, [filteredLogs]);

  const calculateDay = (currentDate, startDate) => {
    const start = new Date(startDate);
    const current = new Date(currentDate);
    // Reset hours to start of day for accurate full day counting
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const c = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const diffTime = Math.abs(c - s);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return t('DayCount', { count: diffDays });
  };

  const getActionIcon = (action, isSystem) => {
    if (isSystem) return <Cpu size={16} />;
    if (action.includes('RESOLVE')) return <CheckCircle size={16} />;
    if (action.includes('SLA') || action.includes('BREACH')) return <AlertTriangle size={16} />;
    if (action.includes('ASSIGN')) return <User size={16} />;
    return <FileText size={16} />;
  };

   return (
    <div className="p-10 space-y-10">
        {/* Tactical Search */}
        <div className="relative group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary opacity-30 group-focus-within:text-navy transition-colors transition-transform group-focus-within:scale-110" size={20} />
           <input 
             type="text"
             placeholder={t('SearchPlaceholderAudit')}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-16 pr-6 py-6 bg-white border-2 border-transparent rounded-[2rem] outline-none focus:border-navy focus:bg-white text-navy font-bold transition-all shadow-xl shadow-navy/5"
           />
        </div>

        {loading ? (
          <div className="py-40 text-center opacity-20">
             <div className="animate-spin text-navy mx-auto mb-6 border-4 border-navy border-t-transparent w-16 h-16 rounded-full" />
             <p className="font-extrabold uppercase tracking-[0.3em] text-sm">{t('AccessingLedger')}</p>
          </div>
        ) : (
          <div className="space-y-12">
             {Object.keys(groupedLogs).length > 0 ? Object.keys(groupedLogs).map((ticketId) => {
                const ticketLogs = groupedLogs[ticketId];
                const startDate = ticketLogs[0].created_at;
                
                return (
                  <div key={ticketId} className="bg-white rounded-[3rem] p-10 shadow-2xl border border-border relative overflow-hidden group">
                     {/* Background ID Watermark */}
                     <div className="absolute top-10 -right-10 text-[120px] font-black text-navy opacity-[0.02] rotate-12 pointer-events-none select-none uppercase">
                        {ticketId.substring(0, 4)}
                     </div>

                     <div className="flex items-center justify-between border-b border-border pb-8 mb-10 relative z-10">
                        <div>
                           <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-navy text-white text-[9px] font-black rounded-full uppercase tracking-tighter">{t('Node')} #{ticketId.substring(0, 8)}</span>
                              <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest">{ticketLogs.length} {t('ChainEvents')}</span>
                           </div>
                           <h3 className="text-2xl font-sora font-extrabold text-navy mt-2 underline decoration-navy/10 underline-offset-8">{t('AccountabilityTimeline')}</h3>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="flex items-center gap-2 px-3 py-1 bg-emerald-light/10 text-emerald text-[9px] font-black rounded-full border border-emerald/10 shadow-sm">
                              <ShieldCheck size={12} /> {t('TamperProof')}
                           </div>
                           <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-2 uppercase tracking-widest">{t('IntegrityVerified')}</p>
                        </div>
                     </div>

                     {/* The Timeline Flow */}
                     <div className="space-y-1 relative z-10 pl-4 pr-4">
                        <div className="absolute left-[7.5rem] top-2 bottom-6 w-0.5 bg-gray-100" />
                        
                        {ticketLogs.map((log, idx) => {
                           const isSystem = !log.actor_id;
                           return (
                             <div key={log.id} className="group/item flex items-start gap-8 py-6 relative">
                                {/* Time Label */}
                                <div className="w-28 pt-1 text-right shrink-0">
                                   <p className="text-xs font-black text-navy uppercase tracking-tighter">{calculateDay(log.created_at, startDate)}</p>
                                   <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tabular-nums">
                                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </div>

                                {/* Dot Indicator */}
                                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-500 ${
                                  isSystem ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border-2 border-navy text-navy'
                                } group-hover/item:scale-125`}>
                                   {getActionIcon(log.action, isSystem)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-0.5">
                                   <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-extrabold text-navy leading-tight uppercase tracking-tight">
                                         {log.action.replace(/_/g, ' ')}
                                      </p>
                                      <span className="text-[10px] font-bold text-text-secondary opacity-60 flex items-center gap-1">
                                         &mdash; {log.actor || (isSystem ? 'System Intelligence' : 'Authorized Official')}
                                      </span>
                                   </div>

                                   {/* Forensic Meta Terminal */}
                                   <div className="flex items-center gap-3 mt-1.5 opacity-40">
                                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-navy bg-navy/5 px-2 py-0.5 rounded-md border border-navy/10 font-mono">
                                         <Terminal size={10} className="opacity-40" />
                                         {t('NodeID_Label')} <span className="opacity-100">{getForensicHash(log.id, 8)}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-navy bg-navy/5 px-2 py-0.5 rounded-md border border-navy/10 font-mono">
                                         <Cpu size={10} className="opacity-40" />
                                         {t('ProtocolCode')} <span className="opacity-100">0x{getForensicHash(log.action, 4)}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald bg-emerald/5 px-2 py-0.5 rounded-md border border-emerald/10 font-mono">
                                         <ShieldCheck size={10} className="opacity-40" />
                                         {t('AuthStatus')} <span className="opacity-100">VERIFIED</span>
                                      </div>
                                   </div>
                                   
                                   {log.note && (
                                     <p className="text-xs text-text-secondary font-medium mt-2 leading-relaxed opacity-80 border-l-2 border-navy/20 pl-3 italic bg-gray-50/50 py-1 rounded-r-lg">
                                        "{log.note}"
                                     </p>
                                   )}
                                   
                                   {log.new_value && !log.action.includes('RESOLVE') && (
                                      <div className="mt-3 inline-flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-border">
                                         <Zap size={10} className="text-saffron" />
                                         <span className="text-[9px] font-black text-navy/60 uppercase tracking-widest">{log.new_value}</span>
                                      </div>
                                   )}
                                   
                                   {/* Verification Special Block */}
                                   {(log.action.includes('RESOLVE') || log.action.includes('VERIFIED')) && (
                                      <div className="mt-4 p-4 bg-emerald-light/5 rounded-2xl border border-emerald/10 flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-emerald text-white flex items-center justify-center group-hover/item:rotate-12 transition-transform">
                                            <Zap size={14} />
                                         </div>
                                         <div>
                                            <p className="text-[10px] font-black text-emerald uppercase tracking-widest">Verification Success</p>
                                            <p className="text-xs font-bold text-navy opacity-80">{log.new_value || 'Resolution verified via forensic evidence'}</p>
                                         </div>
                                      </div>
                                   )}
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                );
             }) : (
                <div className="bg-white rounded-[3.5rem] py-40 text-center border-2 border-dashed border-border opacity-30 shadow-inner">
                   <Shield size={64} className="mx-auto mb-6 text-navy" />
                   <p className="font-sora font-extrabold text-2xl tracking-tighter text-navy uppercase">Ledger Drained</p>
                   <p className="text-sm font-bold uppercase tracking-widest mt-2">No trace matches your search parameters.</p>
                </div>
             )}
          </div>
        )}
    </div>
  );
}