import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import StatusTimeline from '../../components/complaint/StatusTimeline';
import { MapPin, Info, Tag, Calendar, Shield, Share2, Users, ChevronLeft, CheckCircle } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const [ticketRes, assignRes] = await Promise.all([
          supabase.from('master_tickets').select('*, complaints(*), audit_log(*)').eq('id', id).single(),
          supabase.from('officer_assignments').select('*, profiles(full_name, department, city)').eq('ticket_id', id).order('assigned_at', { ascending: false }).limit(1).maybeSingle()
        ]);
        if (ticketRes.error) throw ticketRes.error;
        setTicket(ticketRes.data);
        setTimeline(ticketRes.data.audit_log || []);
        setAssignment(assignRes.data);
      } catch (error) {
        toast.error(t('TelemetrySyncFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();

    // Real-time sync for ticket updates
    const sub = supabase.channel(`ticket-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'master_tickets', filter: `id=eq.${id}` },
      (payload) => {
        setTicket(prev => ({ ...prev, ...payload.new }));
        toast.success(t('RealtimeUpdate'));
      }).subscribe();

    // Real-time sync for reassignments
    const assignSub = supabase.channel(`assign-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'officer_assignments', 
        filter: `ticket_id=eq.${id}` 
      }, async (payload) => {
        const { data } = await supabase.from('officer_assignments')
          .select('*, profiles(full_name, department, city)')
          .eq('id', payload.new.id)
          .single();
        if (data) setAssignment(data);
        toast.success(t('OfficerDispatched'));
      }).subscribe();

    return () => {
      if (sub) supabase.removeChannel(sub);
      if (assignSub) supabase.removeChannel(assignSub);
    };
  }, [id]);

  if (loading) return <div className="p-12 text-center text-text-secondary">{t('SyncingNagarVaani')}</div>;
  if (!ticket) return <div className="p-12 text-center text-text-secondary">{t('ComplaintNotFound')}</div>;

  return (
    <div className="min-h-screen bg-bg pb-12">
      <header className="bg-surface card-shadow px-6 py-4 border-b border-border mb-8 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
           <Link to="/citizen/dashboard" className="text-navy font-bold flex items-center gap-2 hover:text-saffron transition">
              <ChevronLeft size={20} /> {t('BackToDashboard')}
           </Link>
           <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition" title={t('ShareToken')}>
                 <Share2 size={18} className="text-navy" />
              </button>
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl p-8 card-shadow space-y-6">
            <div className="flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-xs font-bold text-saffron bg-saffron-light px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {ticket.category}
                     </span>
                     <span 
                        onClick={() => {
                           navigator.clipboard.writeText(ticket.id);
                           toast.success(t('TokenCached'));
                        }}
                        className="text-xs font-bold text-text-secondary border border-border px-2.5 py-1 rounded-full uppercase tracking-widest cursor-pointer hover:bg-navy hover:text-white transition flex items-center gap-2"
                        title={t('CopyAuditID')}
                     >
                        <Tag size={12} /> #{ticket.id.substring(0, 8)}
                     </span>
                  </div>
                  <h1 className="text-3xl font-sora font-extrabold text-navy leading-tight">{ticket.title}</h1>
               </div>
            </div>

            <p className="text-text-secondary leading-relaxed text-lg">{ticket.description}</p>

            <div className="grid grid-cols-2 gap-4 py-6 border-y border-border">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-navy shrink-0">
                     <MapPin size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{t('Location')}</p>
                     <p className="text-sm font-bold text-navy truncate max-w-[120px]">{ticket.extracted_location || 'Mumbai'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-navy shrink-0">
                     <Calendar size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{t('FiledDate')}</p>
                     <p className="text-sm font-bold text-navy">{formatDate(ticket.created_at)}</p>
                  </div>
               </div>
            </div>

            {ticket.cluster_size > 1 && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                 <Info size={18} className="text-blue-600 mt-0.5" />
                 <div>
                    <h4 className="text-sm font-bold text-blue-900">{t('AIClusterDetected')}</h4>
                    <p className="text-xs text-blue-700 mt-0.5">{t('ClusterDesc', { count: ticket.cluster_size, category: ticket.category?.toLowerCase() })}</p>
                 </div>
              </div>
            )}
          </div>

          {ticket.status === 'resolved' && (
            <div className="bg-emerald-light border border-emerald p-6 rounded-2xl flex flex-col gap-4 animate-fade-in shadow-soft">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald text-white flex items-center justify-center shadow-lg">
                     <CheckCircle size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-sora font-extrabold text-emerald-900 leading-tight">{t('CivicImprovementVerified')}</h3>
                     <p className="text-sm text-emerald-700 font-medium">{t('ResolutionConfirmed')}</p>
                  </div>
               </div>
                {/* Before/After photos space */}
                <div className="grid grid-cols-2 gap-6 mt-4">
                   <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald/60">{t('BeforePhoto')}</p>
                      <div className="aspect-[4/3] bg-white rounded-2xl border border-emerald/20 overflow-hidden shadow-inner font-bold text-xs uppercase tracking-widest text-emerald-600 flex items-center justify-center">
                         {ticket.before_image_url ? (
                           <img src={ticket.before_image_url} alt="Before" className="w-full h-full object-cover" />
                         ) : (
                           <span>{t('NoImage')}</span>
                         )}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald/60">{t('AfterPhoto')}</p>
                      <div className="aspect-[4/3] bg-white rounded-2xl border border-emerald/20 overflow-hidden shadow-inner font-bold text-xs uppercase tracking-widest text-emerald-600 flex items-center justify-center">
                         {ticket.after_image_url ? (
                           <img src={ticket.after_image_url} alt="After" className="w-full h-full object-cover" />
                         ) : (
                           <span>{t('NoImage')}</span>
                         )}
                      </div>
                   </div>
                </div>
            </div>
          )}

          {/* Citizen Feedback Terminal */}
          {ticket.status === 'resolved' && (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-navy/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Shield size={120} className="text-navy" />
               </div>
               <div className="relative z-10 space-y-8">
                  <div>
                     <h3 className="text-2xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('RateDepartmentExperience')}</h3>
                     <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40">
                        {t('FeedbackFor')} <span className="text-navy">{ticket.department || ticket.category}</span>
                     </p>
                  </div>
                  
                  <ReviewForm ticketId={id} department={ticket.department || ticket.category} />
               </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-surface rounded-2xl p-8 card-shadow">
              <h3 className="text-lg font-sora font-extrabold text-navy mb-6 uppercase tracking-wider text-[11px] border-b border-border pb-4">{t('LiveTrack')}</h3>
              <StatusTimeline currentStatus={ticket.status} timeline={timeline} />
           </div>

           {assignment && (
             <div className="bg-surface rounded-2xl p-6 card-shadow border border-emerald/20 border-l-4 border-l-emerald animate-fade-in">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4">{t('ActiveSpecialist')}</h4>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-white shadow-md">
                      <Users size={24} />
                   </div>
                   <div>
                      <p className="text-sm font-extrabold text-navy tracking-tight">{assignment.profiles.full_name}</p>
                      <div className="flex gap-1.5 mt-1">
                         <span className="text-[9px] font-bold bg-gray-100 px-2 py-0.5 rounded text-text-secondary uppercase">{ticket.category}</span>
                         <span className="text-[9px] font-bold bg-navy text-white px-2 py-0.5 rounded uppercase">{assignment.profiles.city}</span>
                      </div>
                   </div>
                </div>
                {assignment.distance_km > 0 && (
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                     <span className="text-[10px] font-bold text-text-secondary uppercase">{t('DispatchedFrom')}</span>
                     <span className="text-xs font-bold text-navy">{t('DistAway', { dist: assignment.distance_km.toFixed(1) })}</span>
                  </div>
                )}
             </div>
           )}

           <div className="bg-navy p-6 rounded-2xl shadow-lg text-white space-y-4">
              <div className="flex items-center gap-2">
                 <Shield size={20} className="text-saffron" />
                 <h4 className="font-sora font-bold text-sm">{t('AccountabilityInfo')}</h4>
              </div>
              <p className="text-xs text-white/70 leading-relaxed font-medium">{t('AccountabilityLogDesc')}</p>
           </div>
        </div>
      </main>
    </div>
  );
}

function ReviewForm({ ticketId, department }) {
   const [rating, setRating] = useState(0);
   const [hover, setHover] = useState(0);
   const [comment, setComment] = useState('');
   const [isSubmitted, setIsSubmitted] = useState(false);
   const [loading, setLoading] = useState(false);
   const { t } = useTranslation();

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (rating === 0) return toast.error(t('PleaseSelectRating'));

      setLoading(true);
      try {
         const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5176';
         const res = await fetch(`${backendUrl}/api/tickets/${ticketId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, comment, department })
         });
         
         if (res.ok) {
            setIsSubmitted(true);
            toast.success(t('FeedbackSynchronized'));
         } else {
            throw new Error('Sync Failed');
         }
      } catch (err) {
         toast.error(t('ReviewSubmissionFailed'));
      } finally {
         setLoading(false);
      }
   };

   if (isSubmitted) {
      return (
         <div className="bg-emerald/5 border border-emerald/10 p-8 rounded-2xl text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle size={32} />
            </div>
            <h4 className="text-lg font-extrabold text-navy uppercase tracking-tight">{t('ReviewCommited')}</h4>
            <p className="text-xs font-bold text-text-secondary opacity-60 mt-1">{t('FeedbackAuditTrailDesc')}</p>
         </div>
      );
   }

   return (
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
               <button
                  key={star}
                  type="button"
                  className={`p-2 transition-all duration-300 transform hover:scale-125 ${
                     star <= (hover || rating) ? 'text-saffron' : 'text-gray-200'
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
               >
                  <Tag size={32} fill={star <= (hover || rating) ? 'currentColor' : 'none'} />
               </button>
            ))}
         </div>

         <div className="space-y-4">
            <textarea
               className="w-full h-32 bg-gray-50 border border-border rounded-2xl p-6 text-sm font-bold text-navy outline-none focus:ring-2 ring-navy/10 resize-none transition-all"
               placeholder={t('ShareQualitativeInsights')}
               value={comment}
               onChange={(e) => setComment(e.target.value)}
            />
            
            <button
               type="submit"
               disabled={loading || rating === 0}
               className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-[1.02] transition active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
            >
               {loading ? <CheckCircle className="animate-spin" size={20} /> : <Shield size={18} />}
               {loading ? t('SyncingFeedback') : t('SubmitTacticalReview')}
            </button>
         </div>
      </form>
   );
}