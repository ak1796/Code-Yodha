import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRealtimeTickets } from '../../hooks/useRealtimeTickets';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import ComplaintForm from '../../components/complaint/ComplaintForm';
import { Plus, LogOut, Shield, MessageSquare, Activity, ChevronRight, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function CitizenDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { tickets, loading } = useRealtimeTickets();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const myTickets = tickets.filter(t =>
    t.creator_id === profile?.id ||
    (t.id && localStorage.getItem(`token_${t.id}`))
  );

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5176';
      const payload = { ...formData, user_id: profile?.id };
      const response = await axios.post(`${backendUrl}/api/complaints`, payload);
      if (response.status === 201) {
        toast.success("Signal ingestion successful!");
        if (formData.is_anonymous) {
          localStorage.setItem(`token_${response.data.ticket_id}`, response.data.anonymous_token);
        }
        setShowForm(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Signal ingestion failed. Check jurisdictional grid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg antialiased">
      <header className="bg-surface card-shadow px-6 py-4 border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-saffron shadow-lg">
                <Activity size={24} />
             </div>
             <h1 className="text-xl font-sora font-extrabold text-navy tracking-tight hidden sm:block">
               NagarVaani <span className="text-xs font-bold text-text-secondary opacity-50 ml-1">{t('Citizen')}</span>
             </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
               <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">{t('RegisteredCitizen')}</span>
               <span className="text-sm font-extrabold text-navy mt-1 tracking-tight">{profile?.full_name}</span>
            </div>
            <button onClick={signOut} className="p-2 hover:bg-gray-100 rounded-lg transition text-text-secondary" title={t('Logout')}>
               <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           <div className="bg-navy p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="flex justify-between items-start">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-saffron mb-6">
                    <Plus size={28} />
                 </div>
              </div>
              <div>
                 <h3 className="text-2xl font-sora font-extrabold leading-tight">{t('NeedSupport')}</h3>
                 <p className="text-sm text-white/70 mt-2 font-medium">{t('FileNewIssue')}</p>
                 <button
                   onClick={() => setShowForm(true)}
                   className="mt-6 bg-saffron text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg transition flex items-center gap-2 group"
                 >
                    {t('StartNewReport')} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </div>

           <div className="bg-surface p-8 rounded-3xl shadow-soft border border-border flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-emerald-light text-emerald rounded-2xl flex items-center justify-center">
                    <Shield size={28} />
                 </div>
                 <span className="text-emerald font-bold text-2xl font-sora tracking-tighter">88%</span>
              </div>
              <div>
                 <h3 className="text-xl font-sora font-extrabold text-navy">{t('WardATrust')}</h3>
                 <p className="text-xs text-text-secondary mt-1 font-medium italic">{t('HighResolutionRate')}</p>
              </div>
           </div>

           <div className="bg-surface p-8 rounded-3xl shadow-soft border border-border flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-amber-light text-amber rounded-2xl flex items-center justify-center">
                    <MessageSquare size={28} />
                 </div>
                 <span className="text-navy font-bold text-2xl font-sora tracking-tighter">{myTickets.length}</span>
              </div>
              <div>
                 <h3 className="text-xl font-sora font-extrabold text-navy">{t('ActiveReports')}</h3>
                 <p className="text-xs text-text-secondary mt-1 font-medium italic">{t('LiveTrackingCases')}</p>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-sora font-extrabold text-navy tracking-tight">{t('TimelineActivity')}</h2>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{t('LatestUpdatesFirst')}</div>
           </div>

           {loading ? (
              <div className="py-24 text-center text-text-secondary font-sora font-bold animate-pulse">{t('SyncingNagarVaani')}</div>
           ) : myTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {myTickets.map(ticket => (
                  <ComplaintCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={(id) => navigate(`/citizen/complaints/${id}`)}
                  />
                ))}
              </div>
           ) : (
              <div className="py-24 text-center bg-surface rounded-3xl border border-border border-dashed shadow-inner flex flex-col items-center gap-4 group hover:border-navy transition duration-500">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-navy opacity-20 group-hover:opacity-40 transition duration-500">
                   <Activity size={48} />
                </div>
                <div>
                   <p className="text-xl font-sora font-bold text-navy opacity-60">{t('CivicSilence')}</p>
                   <p className="text-sm text-text-secondary mt-1 font-medium italic">{t('PastReportsHere')}</p>
                </div>
                <button onClick={() => setShowForm(true)} className="mt-4 text-navy font-bold text-xs uppercase tracking-widest hover:text-saffron transition flex items-center gap-2">
                   <Plus size={16} /> {t('FileFirstReport')}
                </button>
              </div>
           )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 backdrop-blur-md bg-navy/20 animate-fade-in overflow-y-auto overflow-x-hidden">
           <div className="bg-surface max-w-4xl w-full rounded-[2.5rem] shadow-2xl relative my-auto">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-navy/5 text-navy rounded-full flex items-center justify-center hover:bg-navy hover:text-white transition z-10"
              >
                <X size={20} />
              </button>
              <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
                 <ComplaintForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
