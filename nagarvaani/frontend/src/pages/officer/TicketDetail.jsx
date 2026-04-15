import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from "../../lib/supabaseClient";
import SLATimer from "../../components/officer/SLATimer";
import MapComponent from "../../components/map/MapComponent";
import ResolutionModal from "../../components/officer/ResolutionModal";
import { useAuth } from "../../context/AuthContext";
import { 
  MapPin, Info, Users, ArrowLeft, CheckCircle, MessageSquare, 
  AlertTriangle, ShieldAlert, Clock, Globe, ShieldCheck, Mail, History
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchTicketData();
    const subscription = supabase
      .channel(`ticket-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_tickets', filter: `id=eq.${id}` }, fetchTicketData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log', filter: `ticket_id=eq.${id}` }, (payload) => {
        setAuditLog(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [id]);

  const fetchTicketData = async () => {
    try {
      const { data: ticketData, error: tErr } = await supabase
        .from('master_tickets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (tErr) throw tErr;
      setTicket(ticketData);

      const { data: logData } = await supabase
        .from('audit_log')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: false });
      
      setAuditLog(logData || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync jurisdictional data");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5176';
      const token = localStorage.getItem('nv_token');
      
      const res = await axios.patch(`${backendUrl}/api/tickets/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success(`Node transition: ${newStatus.toUpperCase()}`);
        fetchTicketData(); // Refresh UI
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Transition blocked by system authorization";
      toast.error(msg);
    }
  };

  if (loading || !ticket) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
       <div className="p-20 text-center animate-pulse py-40 text-navy font-sora font-extrabold text-2xl tracking-tighter">
          DECIPHERING ENCRYPTED NODE...
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-8 lg:p-16 animate-fade-in pb-32">
       <button onClick={() => navigate(-1)} className="mb-10 flex items-center gap-3 text-text-secondary hover:text-navy transition font-bold group">
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:-translate-x-1 transition-transform">
             <ArrowLeft size={18} />
          </div>
          <span className="text-xs uppercase tracking-[0.2em]">{t('ExitHQ')}</span>
       </button>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Info Columns */}
          <div className="lg:col-span-8 space-y-12">
             
             {/* Header Identity */}
             <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="px-5 py-1.5 bg-navy text-white text-[10px] font-black rounded-full uppercase tracking-widest">UGIRP-{id.substring(0, 5)}</span>
                         <span className="text-text-secondary opacity-30 text-xs font-bold uppercase tracking-widest italic">{ticket.category} / {profile?.department || 'CITY'} JURISDICTION</span>
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-sora font-extrabold text-navy tracking-tighter leading-tight max-w-2xl">{ticket.title}</h1>
                      <div className="flex items-center gap-6 pt-4">
                         <Badge icon={<MapPin size={14}/>} label={ticket.address || 'Andheri West, Mumbai'} />
                         <Badge icon={<ShieldAlert size={14}/>} label={`Priority ${ticket.priority_score}`} color="crimson" />
                         <Badge icon={<Clock size={14}/>} label="Auto-Assigned" />
                      </div>
                   </div>
                   <SLATimer deadline={ticket.sla_deadline} isResolved={ticket.status === 'resolved'} />
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-navy/5 rounded-full blur-[100px]" />
             </div>

             {/* Intelligence Block: Translation & Description */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-border">
                   <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-text-secondary mb-6 border-b border-border pb-4">
                      <Globe size={18} className="text-navy" /> {t('OriginalSignal')}
                   </h3>
                   <p className="text-navy font-bold leading-relaxed opacity-80 italic">"{ticket.original_description || 'Municipal signal detected in local dialect. AI translation active.'}"</p>
                </div>
                <div className="bg-navy rounded-[3rem] p-10 shadow-2xl text-white">
                   <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/40 mb-6 border-b border-white/10 pb-4">
                      <ShieldCheck size={18} className="text-saffron" /> {t('GeminiIntelligenceTranslation')}
                   </h3>
                   <p className="text-lg font-sora font-extrabold leading-relaxed text-saffron-light/90">"{ticket.description}"</p>
                </div>
             </div>

             {/* Strategic Map & Clustering */}
             <div className="bg-white rounded-[3.5rem] p-10 shadow-soft border border-border space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('JurisdictionalClusterMap')}</h3>
                   <div className="flex gap-4">
                      <Metric label="Merged Nodes" val={ticket.cluster_size || 1} />
                      <Metric label={t('PublicSignals')} val={Math.floor((ticket.cluster_size || 1) * 0.6)} />
                   </div>
                </div>
                <div className="h-[400px] rounded-[2.5rem] overflow-hidden border-4 border-gray-50 bg-gray-100 flex items-center justify-center text-navy font-bold">
                   <MapComponent lat={ticket.lat} lng={ticket.lng} />
                </div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40 italic text-center">Visualizing jurisdictional telemetry across the municipal grid.</p>
             </div>

             {/* Accountability Section: USP 9 SLA */}
             <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                   <h4 className="flex items-center gap-3 text-sm font-black text-navy uppercase tracking-widest mb-10 border-b border-border pb-6">
                      <AlertTriangle size={20} className="text-crimson" /> USP 9 Accountability Window
                   </h4>
                   <div className="space-y-8">
                      <TimelineRow label="First Detected" val={new Date(ticket.created_at).toLocaleString()} highlight />
                      <TimelineRow label="SLA Type" val={`${ticket.category} Response Grid`} />
                      <TimelineRow label="SLA Counter Offset" val="Zero (Pre-form filing window included)" />
                   </div>
                </div>
                <div className="bg-bg rounded-3xl p-8 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 mb-4">SLA Commencement Matrix</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <span className="text-xs font-bold text-navy">{t('PublicSignalOffset')}</span>
                         <span className="text-2xl font-sora font-black text-crimson">-9h 44m</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                         <div className="w-3/4 h-full bg-crimson" />
                      </div>
                      <p className="text-[9px] font-bold text-crimson uppercase tracking-widest italic opacity-60">System initiated accountability before official report.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Forensic Audit Static Sidebar */}
          <div className="lg:col-span-4 space-y-12">
             {/* Action Control */}
             <div className="bg-navy rounded-[3rem] p-10 shadow-2xl text-white space-y-10">
                <h3 className="text-lg font-sora font-extrabold uppercase tracking-tight text-saffron">Action Terminal</h3>
                
                <div className="space-y-4">
                   {['filed', 'assigned', 'in_progress'].includes(ticket.status) && (
                      <button 
                        onClick={() => updateStatus(ticket.status === 'in_progress' ? 'resolved' : 'in_progress')}
                        className="w-full bg-saffron text-white py-6 rounded-2xl font-bold uppercase tracking-widest hover:scale-105 transition shadow-xl"
                      >
                         {ticket.status === 'in_progress' ? t('FinalizeResolution') : t('InitializeResolution')}
                      </button>
                   )}
                   {ticket.status === 'in_progress' && (
                     <button 
                       onClick={() => setIsResolving(true)}
                       className="w-full bg-emerald text-white py-6 rounded-2xl font-bold uppercase tracking-widest hover:scale-105 transition shadow-xl mt-4"
                     >
                        {t('SubmitEvidenceSuite')}
                     </button>
                   )}
                   {ticket.status === 'resolved' && (
                     <div className="w-full bg-emerald/20 text-emerald py-6 rounded-2xl font-bold uppercase tracking-widest text-center border border-emerald/20">
                        {t('SignalResolvedBadge')}
                     </div>
                   )}
                </div>

                <div className="pt-8 border-t border-white/10 italic text-[10px] font-medium opacity-40">
                   Changing node status will trigger real-time dispatch to citizen dashboard and audit ledger.
                </div>
             </div>

             {/* Forensic Timeline */}
             <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-border min-h-[500px]">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-3">
                      <History size={18} /> {t('ForensicLedger')}
                   </h3>
                   <span className="px-3 py-1 bg-emerald-light/20 text-emerald text-[8px] font-black rounded-full uppercase tracking-widest">Tamper-Proof</span>
                </div>

                <div className="space-y-10 relative">
                   <div className="absolute left-3 top-2 bottom-0 w-0.5 bg-gray-100" />
                   
                   {auditLog.map((log, idx) => (
                      <div key={idx} className="relative pl-10 animate-slide-in-right" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className="absolute left-1 top-1.5 w-4 h-4 rounded-full bg-white border-4 border-navy shadow-sm z-10" />
                         <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40 mb-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                         <p className="text-sm font-bold text-navy leading-tight">{log.action}</p>
                         <p className="text-[9px] font-black text-navy/40 uppercase tracking-widest mt-1">Executor: {log.actor} ({log.actor_role})</p>
                      </div>
                   ))}

                   {!auditLog.length && (
                      <div className="relative pl-10 opacity-30">
                        <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full bg-navy opacity-40" />
                        <p className="text-xs font-bold leading-tight">Awaiting Specialist Action...</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>

       {isResolving && (
         <ResolutionModal 
           ticketId={id} 
           onClose={() => setIsResolving(false)} 
           onSuccess={() => { setIsResolving(false); fetchTicketData(); }} 
         />
       )}
    </div>
  );
}

function Badge({ icon, label, color }) {
   return (
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border border-border shadow-sm bg-bg`}>
         <div className={color === 'crimson' ? 'text-crimson' : 'text-navy'}>{icon}</div>
         <span className="text-[10px] font-black uppercase tracking-widest text-navy">{label}</span>
      </div>
   );
}

function Metric({ label, val }) {
   return (
      <div className="bg-bg px-6 py-2 rounded-2xl border border-border">
         <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">{label}</p>
         <p className="text-xl font-sora font-black text-navy leading-none tabular-nums">{val}</p>
      </div>
   );
}

function TimelineRow({ label, val, highlight }) {
   return (
      <div>
         <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40 mb-2">{label}</p>
         <p className={`text-sm font-bold ${highlight ? 'text-crimson' : 'text-navy'}`}>{val}</p>
      </div>
   );
}
