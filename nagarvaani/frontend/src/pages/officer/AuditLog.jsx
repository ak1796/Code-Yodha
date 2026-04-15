import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Shield, Clock, FileText, CheckCircle, Search } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function OfficerAudit() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchMyLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_log')
          .select('*')
          .eq('actor_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setLogs(data);
      } catch (err) {
        toast.error("Audit stream interrupted");
      } finally {
        setLoading(false);
      }
    };
    if (profile?.id) fetchMyLogs();
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-bg p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-emerald rounded-2xl flex items-center justify-center text-white shadow-xl">
                 <Shield size={24} />
              </div>
              <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight">{t('SovereignAuditTitle')}</h1>
            </div>
            <p className="text-text-secondary font-medium opacity-60 italic">{t('ImmutableLedger')}</p>
          </div>
          <div className="bg-white border border-border px-6 py-4 rounded-3xl shadow-soft">
             <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-40">{t('TotalOperationalLogs')}</p>
             <p className="text-2xl font-sora font-extrabold text-navy mt-1">{logs.length}</p>
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center opacity-20">
             <div className="animate-spin text-navy mx-auto mb-4 border-4 border-navy border-t-transparent w-12 h-12 rounded-full" />
             <p className="font-bold uppercase tracking-widest text-xs">{t('AccessingLedger')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-[3rem] p-10 card-shadow border border-border overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="text-left border-b border-border">
                         <th className="pb-6 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{t('Timestamp')}</th>
                         <th className="pb-6 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{t('TacticalAction')}</th>
                         <th className="pb-6 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{t('AssociatedNode')}</th>
                         <th className="pb-6 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] text-right">{t('VerificationStatus')}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {logs.map((log) => (
                        <tr key={log.id} className="group hover:bg-gray-50 transition-colors">
                           <td className="py-6 whitespace-nowrap">
                              <div className="flex flex-col">
                                 <span className="text-sm font-extrabold text-navy">{formatDate(log.created_at)}</span>
                                 <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-tighter mt-1 flex items-center gap-1">
                                    <Clock size={10} /> {new Date(log.created_at).toLocaleTimeString()}
                                 </span>
                              </div>
                           </td>
                           <td className="py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0 group-hover:bg-navy group-hover:text-white transition-all">
                                    <FileText size={16} />
                                 </div>
                                 <span className="text-sm font-bold text-navy uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                              </div>
                           </td>
                           <td className="py-6 font-mono text-xs text-text-secondary">
                              {log.ticket_id ? `#${log.ticket_id.substring(0, 12)}...` : 'N/A'}
                           </td>
                           <td className="py-6 text-right">
                              <span className="px-3 py-1 bg-emerald-light/20 text-emerald text-[9px] font-extrabold rounded-full uppercase tracking-widest border border-emerald/10">
                                 {t('ImmutableLog')}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                {logs.length === 0 && (
                   <div className="text-center py-20 opacity-20">
                      <Shield size={48} className="mx-auto mb-4" />
                      <p className="font-sora font-extrabold text-xl">{t('LedgerEmpty')}</p>
                      <p className="text-xs font-medium">{t('InitializeOps')}</p>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
