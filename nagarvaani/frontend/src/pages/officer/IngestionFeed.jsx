import React, { useState } from 'react';
import { useRealtimeTickets } from '../../hooks/useRealtimeTickets';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Activity, Zap, MapPin, Clock, Send, MessageSquare, 
  Globe, Smartphone, Filter, Mail, ChevronDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SOURCES = [
  { id: 'ALL', label: 'All Sources', icon: Activity },
  { id: 'TELEGRAM', label: 'Telegram', icon: Send },
  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { id: 'WEB', label: 'Web', icon: Globe },
  { id: 'EMAIL', label: 'Email', icon: Mail },
  { id: 'TWITTER', label: 'Twitter', icon: Globe },
  { id: 'SMS', label: 'SMS', icon: Smartphone },
];

export default function IngestionFeed() {
  const { tickets, loading } = useRealtimeTickets();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredTickets = tickets.filter(t => {
    const matchesDept = !profile?.department || t.category?.toUpperCase() === profile.department?.toUpperCase() || profile?.role === 'admin';
    const matchesCity = !profile?.city || t.city?.toUpperCase() === profile.city?.toUpperCase() || profile?.role === 'admin';
    const matchesSource = activeFilter === 'ALL' || t.source?.toUpperCase() === activeFilter;
    return matchesDept && matchesCity && matchesSource;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getSourceIcon = (source) => {
    const found = SOURCES.find(s => s.id === source?.toUpperCase());
    if (!found) return <Globe size={14} />;
    const Icon = found.icon;
    return <Icon size={14} />;
  };

  return (
    <div className="min-h-screen bg-bg p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
                    <Zap size={24} />
                 </div>
                 <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight">{t('LiveIngestionPool')}</h1>
              </div>
              <p className="text-text-secondary font-medium opacity-60">{t('IngestionPulseDesc', { dept: profile?.department, city: profile?.city })}</p>
           </div>
           
           <div className="relative">
              <button 
                 onClick={() => setShowDropdown(!showDropdown)}
                 className="bg-white border-2 border-border rounded-2xl px-6 py-4 flex items-center gap-6 shadow-xl hover:border-navy transition-all group"
              >
                 <Filter size={18} className="text-navy opacity-40 group-hover:opacity-100" />
                 <div className="flex flex-col items-start">
                    <span className="text-[8px] font-black text-text-secondary opacity-40 uppercase tracking-[0.2em]">{t('SignalSource')}</span>
                    <span className="text-xs font-extrabold text-navy uppercase tracking-widest flex items-center gap-3">
                       {SOURCES.find(s => s.id === activeFilter)?.label}
                       <ChevronDown size={14} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                    </span>
                 </div>
              </button>

              {showDropdown && (
                 <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-border overflow-hidden z-[100] animate-slide-in-up">
                    <div className="p-3 grid grid-cols-1 gap-1">
                       {SOURCES.map(source => {
                          const Icon = source.icon;
                          const isActive = activeFilter === source.id;
                          return (
                             <button
                                key={source.id}
                                onClick={() => {
                                   setActiveFilter(source.id);
                                   setShowDropdown(false);
                                }}
                                className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                                   isActive ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'hover:bg-bg text-navy'
                                }`}
                             >
                                <div className="flex items-center gap-4">
                                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-navy/5'}`}>
                                      <Icon size={16} className={isActive ? 'text-white' : 'text-navy opacity-60'} />
                                   </div>
                                   <span className="text-[10px] font-black uppercase tracking-widest">{source.label}</span>
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 bg-saffron rounded-full animate-pulse" />}
                             </button>
                          );
                       })}
                    </div>
                 </div>
              )}
           </div>
        </header>

        {loading ? (
          <div className="py-40 text-center opacity-20">
             <Activity className="animate-spin text-navy mx-auto mb-4" size={48} />
             <p className="font-bold uppercase tracking-[0.2em]">{t('NeuralSyncActive')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-40 mb-2">
               <Filter size={12} /> {activeFilter} Reports: {filteredTickets.length}
            </div>

            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="bg-surface rounded-3xl p-6 border-2 border-border hover:border-navy transition-all duration-300 card-shadow group">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex gap-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-navy text-white text-[9px] font-extrabold rounded-full uppercase tracking-widest">
                         {getSourceIcon(ticket.source)}
                         <span>{ticket.source || 'WEB'}</span>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-text-secondary text-[9px] font-extrabold rounded-full uppercase tracking-widest border border-border">#{ticket.id.substring(0, 8)}</span>
                   </div>
                   <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest flex items-center gap-2">
                     <Clock size={12} /> {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                   </p>
                </div>
                <h3 className="text-xl font-sora font-extrabold text-navy mb-2 group-hover:text-blue-600 transition tracking-tight">{ticket.title}</h3>
                <p className="text-sm text-text-secondary font-medium leading-relaxed opacity-70 mb-6">{ticket.description}</p>

                <div className="flex items-center gap-6 pt-4 border-t border-border">
                   <div className="flex items-center gap-2 text-[10px] font-extrabold text-navy uppercase tracking-widest">
                      <MapPin size={14} className="opacity-40" /> {ticket.extracted_location || t('JurisdictionSite')}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-extrabold text-emerald uppercase tracking-widest">
                      <Zap size={14} className="opacity-40" /> {t('Priority')} {ticket.priority_score}
                   </div>
                </div>
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="bg-white rounded-[3rem] py-40 text-center border-2 border-dashed border-border opacity-40">
                 <p className="text-2xl font-sora font-extrabold uppercase tracking-tighter">{t('PoolDrained')}</p>
                 <p className="text-sm font-medium">{activeFilter === 'ALL' ? t('NoEmergingIncidents') : `No ${activeFilter} reports current in queue.`}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
