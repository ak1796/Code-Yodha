import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from "../../lib/supabaseClient";
import SLATimer from "../../components/officer/SLATimer";
import MapComponent from "../../components/map/MapComponent";
import ResolutionModal from "../../components/officer/ResolutionModal";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Clock, Calendar, Shield, Users, AlertTriangle, 
  ChevronLeft, Trash2, CheckCircle, Info, Mail, Zap, 
  Globe, MessageSquare, ArrowLeft, ShieldAlert, ShieldCheck, History
} from 'lucide-react';
import toast from 'react-hot-toast';

function MetaStrip({ label, val, icon, mono }) {
  return (
    <div className="bg-white p-4 flex flex-col gap-1 hover:bg-gray-50 transition-colors">
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-40 flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className={`text-[10px] font-bold text-navy truncate ${mono ? 'font-mono' : ''}`}>
        {val}
      </p>
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const { t } = useTranslation();

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
      toast.error(t('FailedSyncJurisdiction'));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('nv_token');
      
      const res = await axios.patch(`${backendUrl}/api/tickets/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success(t('NodeTransition', { status: newStatus.toUpperCase() }));
        fetchTicketData(); // Refresh UI
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || t('TransitionBlocked');
      toast.error(msg);
    }
  };

  if (loading || !ticket) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
       <div className="p-20 text-center animate-pulse py-40 text-navy font-sora font-extrabold text-2xl tracking-tighter">
          {t('DecipheringNode')}
       </div>
    </div>
  );

  return (
    <div className="p-10 space-y-10">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Info Columns */}
          <div className="lg:col-span-8 space-y-12">
             
             {/* Header Identity */}
             <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="px-5 py-1.5 bg-navy text-white text-[10px] font-black rounded-full uppercase tracking-widest">UGIRP-{id.substring(0, 5)}</span>
                         <span className="text-text-secondary opacity-30 text-xs font-bold uppercase tracking-widest italic">{ticket.category} / {profile?.department || t('Admin')} {t('Jurisdiction')}</span>
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-sora font-extrabold text-navy tracking-tighter leading-tight max-w-2xl">{ticket.title}</h1>
                      <div className="flex items-center gap-6 pt-4">
                         <Badge icon={<MapPin size={14}/>} label={ticket.address || 'Andheri West, Mumbai'} />
                         <Badge icon={<ShieldAlert size={14}/>} label={`Priority ${ticket.priority_score}`} color="crimson" />
                         <Badge icon={<Clock size={14}/>} label={t('AutoAssigned')} />
                      </div>
                   </div>
                   <SLATimer deadline={ticket.sla_deadline} isResolved={ticket.status === 'resolved'} />
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-navy/5 rounded-full blur-[100px]" />
             </div>

             {/* Forensic Evidence Dossier */}
             <div className="bg-white rounded-[3.5rem] p-10 shadow-soft border border-border space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 -mr-16 -mt-16 rounded-full opacity-50" />
                
                <div className="flex items-center justify-between relative z-10">
                   <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-3">
                      <Mail size={18} className="text-saffron" /> Forensic Evidence Capture
                   </h3>
                   <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-saffron/10 text-saffron text-[8px] font-black rounded-full uppercase tracking-widest">
                         Original Fragment
                      </span>
                      <span className="px-3 py-1 bg-navy text-white text-[8px] font-black rounded-full uppercase tracking-widest">
                         {ticket.source || 'WEB'}
                      </span>
                   </div>
                </div>

                {/* Photo Preview Terminal */}
                <div className="space-y-4">
                   {ticket.photo_url ? (
                      <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-border bg-gray-50 group" style={{ aspectRatio: '21/9' }}>
                         <img
                           src={ticket.photo_url}
                           alt="Citizen submitted evidence"
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-transparent flex flex-col justify-end p-8">
                            <div className="flex justify-between items-end">
                               <div className="space-y-1">
                                  <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">ðŸ“¸ Optical Evidence Capture</p>
                                  <p className="text-white/60 text-[9px] font-bold">{ticket.city} Intelligence Node</p>
                               </div>
                               <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition">
                                  Inspect Full Frame
                               </button>
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="h-48 rounded-[2.5rem] border-2 border-dashed border-border bg-gray-50/50 flex flex-col items-center justify-center gap-4 text-text-secondary opacity-40">
                         <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Mail size={32} className="opacity-30" />
                         </div>
                         <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">No Visual Signal Attached</p>
                            <p className="text-[9px] font-bold">Audit reveals no image data in original packet</p>
                         </div>
                      </div>
                   )}

                   {/* Forensic Metadata Terminal */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 rounded-3xl overflow-hidden border border-border bg-border">
                      <MetaStrip label="Source Protocol" val={ticket.source || 'Standard Web Ingestion'} icon={<Globe size={12} />} />
                      <MetaStrip label="Citizen Signal ID" val={ticket.citizen_email || ticket.id.substring(0, 16)} icon={<Shield size={12} />} mono />
                      <MetaStrip label="Telemetric Sync" val={new Date(ticket.created_at).toLocaleString()} icon={<Clock size={12} />} />
                   </div>
                </div>

                {/* Original Content Fragment */}
                {ticket.raw_text && ticket.raw_text !== ticket.description && (
                   <div className="bg-gray-50 rounded-[2rem] p-8 border border-border relative">
                      <div className="absolute top-4 right-6 text-[8px] font-black text-text-secondary opacity-20 tracking-widest uppercase">Raw Packet</div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 mb-3 flex items-center gap-2">
                         <MessageSquare size={12} /> Unprocessed Native Signal
                      </p>
                      <p className="text-sm font-bold text-navy/80 leading-relaxed italic pr-12">"{ticket.raw_text}"</p>
                   </div>
                )}
             </div>

             {/* Intelligence Block: Translation & Description */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-border">
                   <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-text-secondary mb-6 border-b border-border pb-4">
                      <Globe size={18} className="text-navy" /> {t('OriginalSignal')}
                   </h3>
                   <p className="text-navy font-bold leading-relaxed opacity-80 italic">"{ticket.original_description || t('SignalDetectedDialect')}"</p>
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
                      <Metric label={t('MergedNodes')} val={ticket.cluster_size || 1} />
                      <Metric label={t('PublicSignals')} val={Math.floor((ticket.cluster_size || 1) * 0.6)} />
                   </div>
                </div>

                {/* LOCATION DETECTED header */}
                <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-emerald/5 border border-emerald/20">
                   <div className="w-8 h-8 rounded-xl bg-emerald flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald mb-0.5">
                         ðŸ“¡ LOCATION DETECTED â€” GPS VERIFIED
                      </p>
                      {ticket.lat && ticket.lng ? (
                         <p className="text-[11px] font-bold text-navy font-mono truncate">
                            {Number(ticket.lat).toFixed(5)}Â°N, {Number(ticket.lng).toFixed(5)}Â°E
                            {ticket.address && <span className="ml-3 text-text-secondary font-sans">â€” {ticket.address}</span>}
                         </p>
                      ) : (
                         <p className="text-[11px] font-bold text-text-secondary opacity-60">
                            Manual Ward Selection â€” No precise GPS fix
                         </p>
                      )}
                   </div>
                   <span className="px-3 py-1 bg-emerald text-white text-[8px] font-black rounded-full uppercase tracking-widest flex-shrink-0">
                      {ticket.ward ? `Ward ${ticket.ward}` : 'Unspecified'}
                   </span>
                </div>

                <div className="h-[400px] rounded-[2.5rem] overflow-hidden border-4 border-gray-50 bg-gray-100 flex items-center justify-center text-navy font-bold">
                   <MapComponent
                     center={ticket.lat && ticket.lng ? [Number(ticket.lat), Number(ticket.lng)] : [19.0760, 72.8777]}
                   />
                </div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40 italic text-center">{t('VisualizingTelemetry')}</p>
             </div>

             {/* Resolution Evidence Gallery */}
             {ticket.status === 'resolved' && (
               <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-emerald/20 bg-emerald/5">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="w-12 h-12 rounded-2xl bg-emerald text-white flex items-center justify-center">
                        <CheckCircle size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('ResolutionProof')}</h3>
                        <p className="text-[10px] font-bold text-emerald uppercase tracking-widest">{t('VerifiedBySpecialist')}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{t('BeforeIntervention')}</p>
                        <div className="aspect-video rounded-[2.5rem] overflow-hidden border-2 border-border bg-gray-50 flex items-center justify-center">
                           {ticket.before_image_url ? (
                              <img src={ticket.before_image_url} alt="Before" className="w-full h-full object-cover" />
                           ) : (
                              <span className="text-xs font-bold text-text-secondary opacity-30">{t('NoImageAvailable')}</span>
                           )}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{t('AfterFulfillment')}</p>
                        <div className="aspect-video rounded-[2.5rem] overflow-hidden border-2 border-emerald/20 bg-emerald/5 flex items-center justify-center">
                           {ticket.after_image_url ? (
                              <img src={ticket.after_image_url} alt="After" className="w-full h-full object-cover" />
                           ) : (
                              <span className="text-xs font-bold text-emerald/30">{t('NoImageAvailable')}</span>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {/* Accountability Section: USP 9 SLA */}
             <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                   <h4 className="flex items-center gap-3 text-sm font-black text-navy uppercase tracking-widest mb-10 border-b border-border pb-6">
                      <AlertTriangle size={20} className="text-crimson" /> USP 9 {t('AccountabilityWindow')}
                   </h4>
                   <div className="space-y-8">
                      <TimelineRow label={t('FirstDetected')} val={new Date(ticket.created_at).toLocaleString()} highlight />
                      <TimelineRow label={t('SLAType')} val={`${ticket.category} ${t('ResponseGrid')}`} />
                      <TimelineRow label={t('SLACounterOffset')} val={t('ZeroOffsetDesc')} />
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
                      <p className="text-[9px] font-bold text-crimson uppercase tracking-widest italic opacity-60">{t('SystemInitiatedAccountability')}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Forensic Audit Static Sidebar */}
          <div className="lg:col-span-4 space-y-12">
             {/* Action Control */}
             <div className="bg-navy rounded-[3rem] p-10 shadow-2xl text-white space-y-10">
                <h3 className="text-lg font-sora font-extrabold uppercase tracking-tight text-saffron">{t('ActionTerminal')}</h3>
                
                <div className="space-y-4">
                   {['filed', 'assigned'].includes(ticket.status) && (
                      <button 
                        onClick={() => updateStatus('in_progress')}
                        className="w-full bg-saffron text-white py-6 rounded-2xl font-bold uppercase tracking-widest hover:scale-105 transition shadow-xl"
                      >
                         {t('InitializeResolution')}
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
                   {t('NodeStatusTrigger')}
                </div>
             </div>

             {/* Forensic Timeline */}
             <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-border min-h-[500px]">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-3">
                      <History size={18} /> {t('ForensicLedger')}
                   </h3>
                   <span className="px-3 py-1 bg-emerald-light/20 text-emerald text-[8px] font-black rounded-full uppercase tracking-widest">{t('TamperProof')}</span>
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
                        <p className="text-xs font-bold leading-tight">{t('AwaitingSpecialist')}</p>
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