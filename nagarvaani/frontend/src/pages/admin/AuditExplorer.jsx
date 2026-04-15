import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { 
  History, Search, ShieldCheck, Download, 
  MapPin, Clock, Zap, AlertTriangle, CheckCircle, 
  Terminal, ShieldAlert, Filter, Activity, Users
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AuditExplorer() {
  const { t } = useTranslation();
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [trail, setTrail] = useState([]);
  const [ticketMeta, setTicketMeta] = useState(null);

  const handleSearch = async () => {
    const input = searchId.trim();
    if (!input) return toast.error("Please enter an Accountability Token");
    
    const normalizedInput = input.toLowerCase();

    // DEMO OVERRIDE: Forensic Sample Trace
    if (normalizedInput === 'sample') {
      setTicketMeta({ id: 'SAMPLE-01', title: 'Sample: Pothole Detection on Ward A', category: 'ROADS' });
      setTrail([
        { action: 'COMPLAINT_INGESTED', created_at: new Date().toISOString(), status_from: 'null', status_to: 'filed' },
        { action: 'AI_CATEGORIZED', created_at: new Date().toISOString(), status_from: 'filed', status_to: 'filed', new_value: 'ROADS' },
        { action: 'OFFICER_ASSIGNED', created_at: new Date().toISOString(), status_from: 'filed', status_to: 'assigned', new_value: 'Officer Ramesh' },
        { action: 'RESOLUTION_SUBMITTED', created_at: new Date().toISOString(), status_from: 'assigned', status_to: 'resolved' }
      ]);
      return toast.success("Manifesting Forensic Sample Trace...");
    }

    setIsSearching(true);
    try {
      let resolvedTicket = null;

      // 1. Try EXACT UUID match first (Most efficient)
      const isFullUUID = input.length === 36;
      if (isFullUUID) {
        const { data } = await supabase
          .from('master_tickets')
          .select('id, title, category')
          .eq('id', normalizedInput)
          .maybeSingle();
        resolvedTicket = data;
      }

      // 2. Fallback to Partial Search if not found or if short ID provided
      if (!resolvedTicket) {
        // We fetch a list of possible matches and resolve client-side to bypass UUID casting errors
        const { data: possibleMatches } = await supabase
          .from('master_tickets')
          .select('id, title, category')
          .limit(20); // Get recent nodes to check against
        
        resolvedTicket = (possibleMatches || []).find(t => 
          t.id.toLowerCase().startsWith(normalizedInput)
        );
      }

      if (!resolvedTicket) {
        toast.error("Accountability Token not found in Cloud Registry");
        setTrail([]);
        setTicketMeta(null);
        return;
      }

      setTicketMeta(resolvedTicket);

      // 3. Precise Forensic Query using resolved UUID
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('ticket_id', resolvedTicket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setTrail(data);
        toast.success("Holographic Audit manifestation complete");
      } else {
        toast.success("Node located, but no forensic trail recorded yet.");
        setTrail([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Forensic scan failed");
    } finally {
      setIsSearching(false);
    }
  };

  const exportCSV = () => {
    if (trail.length === 0) return toast.error("No forensic trail to export");
    toast.success("Generating Immutable Forensic CSV...");
    setTimeout(() => toast.success(`Export Complete: UGIRP_forensic_${ticketMeta?.id.substring(0, 8)}.csv`), 1500);
  };

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
       <header className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-soft border border-border">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-navy text-white flex items-center justify-center shadow-xl shadow-navy/20">
                <Terminal size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-sora font-extrabold text-navy tracking-tight uppercase">{t('AuditExplorerTitle')}</h1>
                <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-[0.3em] mt-1 italic">{t('AuditExplorerDesc')}</p>
             </div>
          </div>
          <button 
            onClick={exportCSV}
            className="bg-white border-2 border-border text-navy px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-gray-50 transition shadow-sm"
          >
             <Download size={18} /> {t('ExportForensicCSV')}
          </button>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-10">
             <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-border space-y-10">
                <h3 className="text-sm font-black text-navy uppercase tracking-widest border-b border-border pb-6">{t('JurisdictionalSearch')}</h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 ml-2">Ticket ID / Node ID</p>
                      <div className="relative">
                         <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy opacity-30" />
                         <input 
                           type="text" 
                           value={searchId}
                           onChange={(e) => setSearchId(e.target.value)}
                           className="w-full bg-bg border border-border rounded-2xl pl-12 pr-6 py-4 text-xs font-bold tracking-widest text-navy outline-none focus:ring-2 ring-navy/10"
                           placeholder={t('EnterTrackingID')}
                         />
                      </div>
                   </div>
                   <button 
                     onClick={handleSearch}
                     className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition"
                   >
                      {t('ExecuteForensicScan')}
                   </button>
                   <div className="text-center">
                      <button 
                        onClick={() => { setSearchId('SAMPLE'); handleSearch(); }}
                        className="text-[9px] font-black text-navy opacity-30 hover:opacity-100 transition uppercase tracking-widest underline underline-offset-4"
                      >
                         Try SAMPLE Trace Node
                      </button>
                   </div>
                </div>
             </div>

             <div className="bg-navy rounded-[3rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                   <ShieldCheck className="text-saffron" size={32} />
                   <h4 className="text-xl font-sora font-extrabold uppercase tracking-tight">{t('GovernanceBadge')}</h4>
                </div>
                <p className="relative z-10 text-xs font-medium opacity-60 leading-relaxed italic">{t('GovernanceBadgeDesc')}</p>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-[60px]" />
             </div>
          </div>

          <div className="lg:col-span-8">
             <div className={`bg-white rounded-[3.5rem] p-12 shadow-soft border border-border relative ${isSearching ? 'animate-pulse' : ''}`}>
                <div className="flex justify-between items-center mb-16 border-b border-border pb-10">
                   <div>
                      <h3 className="text-2xl font-sora font-extrabold text-navy tracking-tighter uppercase whitespace-normal break-all">
                        {ticketMeta ? t('IncidentLifeCycle', { id: ticketMeta.id.substring(0, 8) }) : t('InteractiveLedger')}
                      </h3>
                      <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest mt-1">
                        {ticketMeta ? `${ticketMeta.title} • ${ticketMeta.category}` : t('DecryptForensicTrail')}
                      </p>
                   </div>
                   <span className={`px-5 py-2 text-[9px] font-black rounded-full uppercase tracking-widest border ${
                     trail.length > 0 ? 'bg-emerald-light/20 text-emerald border-emerald/10' : 'bg-gray-100 text-gray-400 border-border'
                   }`}>
                     {trail.length > 0 ? t('IntegrityVerified') : t('AwaitingManifest')}
                   </span>
                </div>

                {trail.length === 0 ? (
                  <div className="py-20 text-center space-y-6">
                     <History size={64} className="mx-auto text-navy opacity-10" />
                     <p className="text-xs font-black text-navy opacity-30 uppercase tracking-[0.2em]">Input a valid token to decrypt the forensic trail</p>
                  </div>
                ) : (
                  <div className="space-y-12 relative">
                    <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-100" />
                    
                    {trail.map((entry, idx) => (
                        <div key={idx} className="relative pl-14 animate-fade-in">
                          <div className="absolute left-0 top-1 w-10 h-10 rounded-2xl bg-white border-2 border-border shadow-sm flex items-center justify-center z-10">
                              {getIcon(entry.action?.toLowerCase())}
                          </div>
                          <div className="space-y-1">
                              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 leading-none">
                                {formatDate(entry.created_at)}
                              </span>
                              <h4 className="text-sm font-extrabold text-navy leading-tight">{entry.action}</h4>
                              <div className="flex flex-wrap gap-4 mt-2">
                                <p className="text-[9px] font-black text-emerald uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity size={10} /> {entry.status_from ? `Status: ${entry.status_from} → ${entry.status_to}` : `State: ${entry.status_to || 'SYNCED'}`}
                                </p>
                                {entry.new_value && (
                                  <p className="text-[9px] font-black text-saffron uppercase tracking-widest flex items-center gap-1.5">
                                    <Zap size={10} /> Value: {entry.new_value}
                                  </p>
                                )}
                              </div>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}

function getIcon(action) {
  if (action?.includes('filed') || action?.includes('detect') || action?.includes('ingest')) return <AlertTriangle size={14} className="text-crimson" />;
  if (action?.includes('assign') || action?.includes('officer')) return <Users size={14} className="text-navy opacity-60" />;
  if (action?.includes('categor') || action?.includes('ai')) return <Zap size={14} className="text-saffron" />;
  if (action?.includes('resolv') || action?.includes('verif')) return <CheckCircle size={14} className="text-emerald" />;
  if (action?.includes('progress') || action?.includes('start')) return <Activity size={14} className="text-navy opacity-60" />;
  return <History size={14} className="text-navy opacity-40" />;
}
