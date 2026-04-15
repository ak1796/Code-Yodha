import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar 
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { 
  History, MapPin, AlertTriangle, Construction, 
  TrendingUp, Calendar, Search, ShieldAlert, Award
} from 'lucide-react';

const MOCK_2Y_DATA = [
  { month: 'Jan', water: 20, roads: 15, garbage: 30 },
  { month: 'Mar', water: 25, roads: 10, garbage: 35 },
  { month: 'May', water: 45, roads: 12, garbage: 40 },
  { month: 'Jul', water: 120, roads: 140, garbage: 45 },
  { month: 'Sep', water: 80, roads: 90, garbage: 42 },
  { month: 'Nov', water: 30, roads: 20, garbage: 60 },
  { month: 'Dec', water: 25, roads: 15, garbage: 85 },
];

const CHRONIC_ZONES = [
  { 
    loc: 'Kurla West', 
    coords: '19.07, 72.87', 
    category: 'ROADS', 
    recurrences: 8, 
    contractor: 'XYZ Constructions', 
    contractor_linked: 6,
    avgDays: 47, 
    lastOccurred: '3 weeks ago' 
  },
  { 
    loc: 'Andheri East', 
    coords: '19.11, 72.86', 
    category: 'WATER', 
    recurrences: 5, 
    contractor: 'XOR Pipe Labs', 
    contractor_linked: 4,
    avgDays: 92, 
    lastOccurred: '1 month ago' 
  },
  { 
    loc: 'Bandra West', 
    coords: '19.05, 72.82', 
    category: 'GARBAGE', 
    recurrences: 12, 
    contractor: 'CleanCity Corp', 
    contractor_linked: 12,
    avgDays: 14, 
    lastOccurred: '4 days ago' 
  },
];

export default function CivicMemory() {
  const { t } = useTranslation();
  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
           <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-4">
              <History className="text-navy opacity-20" size={40} /> {t('CivicMemoryTitle')}
           </h1>
           <p className="text-text-secondary font-medium opacity-60 italic">{t('CivicMemoryDesc')}</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-3xl shadow-soft border border-border">
           <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shadow-lg">
              <Calendar size={20} />
           </div>
           <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{t('PersistenceWindow')}</span>
              <p className="text-sm font-extrabold text-navy uppercase tracking-tighter">{t('ForensicView730')}</p>
           </div>
        </div>
      </header>

      {/* Chronic Zone Table */}
      <div className="bg-white rounded-[3.5rem] shadow-soft border border-border overflow-hidden">
         <div className="p-10 border-b border-border bg-bg/30">
            <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter flex items-center gap-3">
               <ShieldAlert className="text-crimson" size={24} /> {t('ChronicFailures')}
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-border">
                     <Th label={t('LocationNode')} />
                     <Th label={t('Category')} />
                     <Th label={t('Recurrences')} />
                     <Th label={t('ContractorFlag')} />
                     <Th label={t('AvgInterval')} />
                     <Th label={t('LastActive')} />
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {CHRONIC_ZONES.map((zone, idx) => (
                    <tr key={idx} className="hover:bg-bg/50 transition-colors">
                       <td className="py-8 px-10">
                          <div>
                             <p className="text-sm font-extrabold text-navy leading-none mb-1">{zone.loc}</p>
                             <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest leading-none italic">Lat/Lng: {zone.coords}</span>
                          </div>
                       </td>
                       <td className="py-8 text-xs font-black text-navy opacity-60 uppercase tracking-widest px-4">{zone.category}</td>
                       <td className="py-8">
                          <div className="flex items-center gap-3">
                             <span className="text-xl font-sora font-black text-navy">{zone.recurrences}x</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-crimson px-2 py-0.5 bg-crimson/10 rounded-full animate-pulse">Chronic</span>
                          </div>
                       </td>
                       <td className="py-8">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-extrabold text-navy uppercase tracking-tighter">{zone.contractor}</span>
                             <span className="text-[9px] font-bold text-text-secondary opacity-40 uppercase tracking-widest italic">{zone.contractor_linked} linked failures</span>
                             {zone.contractor_linked > 5 && <div className="mt-2 text-[8px] font-black text-white bg-crimson px-2 py-0.5 rounded-full inline-block uppercase tracking-widest">{t('MarkedForAudit')}</div>}
                          </div>
                       </td>
                       <td className="py-8 font-extrabold text-navy text-sm uppercase tracking-tighter tabular-nums">{zone.avgDays} Days</td>
                       <td className="py-8 text-xs font-bold text-navy opacity-40 italic">{zone.lastOccurred}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Memory Timeline & Seasonal Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-12 shadow-soft border border-border">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('TemporalMagnitude')}</h3>
                  <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest mt-1">{t('SeasonalPatterns')}</p>
               </div>
            </div>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_2Y_DATA}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                     <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                     <Area type="monotone" dataKey="roads" stackId="1" stroke="#E8720C" fill="#E8720C" fillOpacity={0.6} />
                     <Area type="monotone" dataKey="water" stackId="1" stroke="#007AFF" fill="#007AFF" fillOpacity={0.4} />
                     <Area type="monotone" dataKey="garbage" stackId="1" stroke="#0D1B40" fill="#0D1B40" fillOpacity={0.2} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-8">
            <h4 className="text-xs font-black text-navy uppercase tracking-[0.2em] opacity-40 flex items-center gap-3">
               <TrendingUp size={16} /> {t('PatternIntelligence')}
            </h4>
            <InsightRow title="Monsoon Multiplier" desc="Roads complaints in Kurla West spike 3x every July/August. Pre-monsoon intervention in June has historically reduced this by 40%." />
            <InsightRow title="Autumn Flux" desc="Water supply complaints in Andheri increase every October-November during pipeline maintenance season." />
            <InsightRow title="Tourist Peak Load" desc="Garbage complaints peak every December-January in tourist areas of Colaba and Marine Lines." />
         </div>
      </div>
    </div>
  );
}

function Th({ label }) {
   return <th className="py-6 px-10 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 italic">{label}</th>;
}

function InsightRow({ title, desc }) {
   return (
      <div className="bg-white rounded-3xl p-8 border border-border shadow-soft group hover:shadow-xl transition-all">
         <h4 className="text-sm font-extrabold text-navy uppercase tracking-tight mb-2 group-hover:text-saffron transition-colors">{title}</h4>
         <p className="text-xs text-text-secondary font-medium leading-relaxed opacity-70 italic">"{desc}"</p>
      </div>
   );
}
