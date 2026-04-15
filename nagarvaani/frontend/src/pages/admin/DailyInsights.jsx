import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain, Zap, AlertTriangle, TrendingUp,
  BarChart3, Clock, RefreshCw, ShieldCheck,
  ArrowRight, MapPin, Activity
} from 'lucide-react';

const MOCK_INSIGHTS = [
  {
    title: "Dharavi Ward Ingestion Spike",
    desc: "Dharavi ward has a 3x spike in waterlogging complaints compared to last week — likely due to pre-emptive DRAINAGE signals from social nodes. Forecasted heavy rain in 48h.",
    type: "CRITICAL",
    category: "DRAINAGE",
    action: "Deploy pre-emptive drain clearing team to Node 12-B before weekend."
  },
  {
    title: "Bandra East SLA Erosion",
    desc: "ELECTRICITY department SLA compliance dropped from 69% to 41% this week — 12 breaches concentrated in Bandra East between Tuesday and Thursday. Infrastructure load peak detected.",
    type: "WARNING",
    category: "ELECTRICITY",
    action: "Authorize overtime for Bandra East grid specialists."
  },
  {
    title: "Post-Rain Pothole Forecast",
    desc: "STORM WATER DRAIN signals in Kurla have tripled since Monday — pattern consistent with post-rain overflow risk. System detects recurrence in XYZ Construction zones.",
    type: "STRATEGIC",
    category: "STORM WATER DRAIN",
    action: "Deploy Roads team for forensic inspection of Kurla-Vikhroli segment."
  }
];

export default function DailyInsights() {
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState("TODAY, 09:03 AM");
  const { t } = useTranslation();

  const regenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTimestamp(`TODAY, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 4000);
  };

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div className="space-y-2">
           <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-4">
              <Brain className="text-saffron" size={40} /> {t('CognitiveBriefing')}
           </h1>
           <p className="text-text-secondary font-medium opacity-60 italic">{t('GeminiDailyTactical')}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
           <span className="text-[10px] font-black text-navy uppercase tracking-widest bg-gray-100 px-4 py-1.5 rounded-full">{timestamp}</span>
           <button 
             onClick={regenerate}
             disabled={loading}
             className="bg-navy text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition shadow-2xl disabled:opacity-20 disabled:scale-100"
           >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />} 
              {loading ? t('IngestingData') : t('RegenerateIntelligence')}
           </button>
        </div>
      </header>

      {loading ? (
        <div className="py-40 text-center space-y-8 animate-pulse">
           <div className="relative inline-block">
              <RefreshCw size={80} className="text-navy opacity-10 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Brain size={32} className="text-saffron animate-pulse" />
              </div>
           </div>
           <p className="text-sm font-black text-navy uppercase tracking-[0.3em] italic">Gemini is synthesizing cross-departmental temporal patterns...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {MOCK_INSIGHTS.map((insight, idx) => (
             <InsightCard key={idx} insight={insight} />
           ))}
        </div>
      )}

      {/* Background Stats Mini-Grid */}
      {!loading && (
        <div className="bg-white rounded-[3.5rem] p-12 shadow-soft border border-border grid grid-cols-1 md:grid-cols-4 gap-12">
           <MiniStat label="Anomalies Detected" val="08" />
           <MiniStat label="Predicted Spikes" val="03" />
           <MiniStat label="Resolution Velocity" val="+12%" />
           <MiniStat label="System IQ" val="94.2" highlight />
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }) {
   const colors = {
      CRITICAL: 'bg-crimson text-white shadow-crimson/20',
      WARNING: 'bg-saffron text-white shadow-saffron/20',
      STRATEGIC: 'bg-navy text-white shadow-navy/20'
   };

   return (
      <div className={`p-10 rounded-[3.5rem] ${colors[insight.type]} shadow-2xl group hover:-translate-y-4 transition-all duration-500 relative overflow-hidden flex flex-col justify-between min-h-[500px]`}>
         <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
               <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  {insight.type === 'CRITICAL' ? <AlertTriangle size={24} /> : insight.type === 'WARNING' ? <Activity size={24} /> : <TrendingUp size={24} />}
               </div>
               <span className="px-4 py-1.5 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/10">{insight.category} NODE</span>
            </div>
            
            <div className="space-y-4">
               <h3 className="text-2xl font-sora font-extrabold tracking-tighter uppercase leading-tight">{insight.title}</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed italic">"{insight.desc}"</p>
            </div>
         </div>

         <div className="relative z-10 pt-10 border-t border-white/10 mt-auto">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Recommended Strategy:</p>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/5 group-hover:border-white/20 transition-all">
               <p className="text-xs font-bold leading-relaxed">{insight.action}</p>
            </div>
         </div>

         <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
      </div>
   );
}

function MiniStat({ label, val, highlight }) {
   return (
      <div className="space-y-1">
         <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40 leading-none">{label}</p>
         <p className={`text-4xl font-sora font-black tracking-tighter ${highlight ? 'text-saffron' : 'text-navy'}`}>{val}</p>
      </div>
   );
}
