import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Shield, Key, ArrowRight, Search, Activity, Lock } from 'lucide-react';
import StatusTimeline from '../../components/complaint/StatusTimeline';
import toast from 'react-hot-toast';

export default function AnonymousTracker() {
  const [token, setToken] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleTrack = async (e) => {
    e.preventDefault();
    if (token.length < 16) return toast.error("Invalid token format");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, master_tickets(*, audit_log(*))')
        .eq('anonymous_token', token)
        .single();
      if (error || !data) throw error;
      setTicket(data.master_tickets);
    } catch (error) {
      toast.error(t('ComplaintNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center pt-24 px-6">
      <div className="max-w-md w-full">
        {!ticket ? (
          <div className="bg-surface rounded-3xl p-10 card-shadow text-center space-y-6">
             <div className="w-16 h-16 rounded-2xl bg-navy text-white flex items-center justify-center mx-auto shadow-lg">
                <Shield size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-sora font-extrabold text-navy leading-tight">{t('WhistleblowerTracking')}</h1>
                <p className="text-sm text-text-secondary mt-2 font-medium">{t('EnterTokenDesc')}</p>
             </div>

             <form onSubmit={handleTrack} className="space-y-4 pt-4">
                <div className="relative group">
                   <Key size={18} className="absolute left-4 top-4 text-text-secondary group-focus-within:text-navy transition" />
                   <input
                     type="text"
                     value={token}
                     onChange={(e) => setToken(e.target.value)}
                     placeholder={t('EnterTokenPlaceholder')}
                     className="w-full pl-12 pr-4 py-4 border border-border rounded-2xl outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 text-sm font-mono font-bold transition"
                     required
                   />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-navy text-white py-4 rounded-2xl font-bold hover:bg-navy-light transition disabled:opacity-50 shadow-xl"
                >
                  {loading ? t('DecryptingStatus') : t('TrackLiveResolution')} <ArrowRight size={20} />
                </button>
             </form>

             <div className="flex items-center gap-2 pt-4 justify-center text-[10px] uppercase font-bold tracking-widest text-[#5A6478]">
                <Lock size={12} className="text-emerald" />
                <span className="text-emerald">{t('EndToEndEncryptedAccess')}</span>
             </div>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl p-10 card-shadow space-y-8 animate-fade-in">
             <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                  <h3 className="text-2xl font-sora font-extrabold text-navy">{t('LiveProgress')}</h3>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-1">Ticket #{ticket.id.substring(0, 8)}</p>
                </div>
                <button onClick={() => setTicket(null)} className="text-saffron font-bold text-xs hover:underline uppercase tracking-widest flex items-center gap-1">
                   <Search size={14} /> {t('NewTrack')}
                </button>
             </div>

             <StatusTimeline currentStatus={ticket.status} timeline={ticket.audit_log} />

             <div className="pt-6 border-t border-border mt-8 flex flex-col gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                   <Activity size={18} className="text-navy opacity-40 mt-1" />
                   <div>
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{t('PublicImpact')}</p>
                      <p className="text-sm font-bold text-navy">{ticket.affected_count} residents affected by this {ticket.category?.toLowerCase()} issue.</p>
                   </div>
                </div>
                <p className="text-[10px] text-center text-text-secondary italic">{t('IdentityHidden')}</p>
             </div>
          </div>
        )}
      </div>

      <div className="mt-12 text-center max-w-sm">
         <p className="text-xs text-text-secondary font-medium leading-relaxed opacity-60">{t('AESEncryption')}</p>
      </div>
    </div>
  );
}
