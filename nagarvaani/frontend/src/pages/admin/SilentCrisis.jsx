import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EyeOff, MapPin, Users, Phone, Users2,
  HelpCircle, ChevronRight, AlertTriangle,
  ShieldAlert, Activity, CheckCircle, MessageSquare,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { citiesConfig } from '../../assets/data/citiesConfig';
import { getEstimatedPopulation } from '../../assets/data/populationMapping';

export default function SilentCrisis() {
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState("Mumbai");

  useEffect(() => {
    fetchSilenceData();
  }, [selectedCity]);

  const fetchSilenceData = async () => {
    setLoading(true);
    try {
      const { data: tickets } = await supabase
        .from('master_tickets')
        .select('ward, city');
      
      const cityConfig = citiesConfig[selectedCity];
      const wardComplaints = {};
      tickets?.filter(t => t.city === selectedCity).forEach(t => {
        const w = t.ward || "Unknown";
        wardComplaints[w] = (wardComplaints[w] || 0) + 1;
      });

      const commonWards = Object.keys(cityConfig.offices || {}).map(k => k.replace(/^Ward\s*/, ''));
      if (commonWards.length === 0) {
        Object.keys(wardComplaints).forEach(w => { if(!commonWards.includes(w)) commonWards.push(w); });
      }

      const calculatedWards = commonWards.map(wName => {
        const count = wardComplaints[wName] || 0;
        const pop = getEstimatedPopulation(selectedCity, wName);
        const ratio = Math.round(pop / (count + 1));
        
        let risk = "LOW";
        let color = "bg-emerald";
        if (ratio > 3000) { risk = "CRITICAL"; color = "bg-crimson"; }
        else if (ratio > 1500) { risk = "HIGH"; color = "bg-saffron"; }
        else if (ratio > 800) { risk = "MEDIUM"; color = "bg-yellow-400"; }

        return { name: wName, population: pop, complaints: count, ratio, risk, color };
      }).sort((a, b) => b.ratio - a.ratio);

      setWards(calculatedWards);
    } catch (err) {
      console.error("Silence fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
       <header className="flex justify-between items-center">
          <div className="space-y-2">
             <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-4">
                <EyeOff className="text-navy opacity-20" size={40} /> {t('SilentCrisisMatrix')}
             </h1>
             <p className="text-text-secondary font-medium opacity-60 italic">{t('SilentCrisisDesc')}</p>
          </div>
          <div className="bg-white px-8 py-4 rounded-3xl shadow-soft border border-[#162F6A]/30 flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-crimson text-white flex items-center justify-center shadow-lg shadow-crimson/20">
                <AlertTriangle size={20} />
             </div>
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{t('GlobalBlindSpots')}</span>
                <p className="text-sm font-extrabold text-navy uppercase tracking-tighter">
                   {t('CriticalNodes', { count: wards.filter(w => w.risk === 'CRITICAL').length.toString().padStart(2, '0') })}
                </p>
             </div>
          </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Ward Table */}
          <div className="lg:col-span-8 bg-white rounded-[3.5rem] shadow-soft border border-[#162F6A]/30 overflow-hidden min-h-[400px]">
             {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                   <RefreshCw className="animate-spin mb-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Scanning Signal Ratios...</span>
                </div>
             ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-border bg-bg/30">
                         <Th label={t('WardJurisdictions')} />
                         <Th label={t('Population')} />
                         <Th label={t('Complaints')} />
                         <Th label={t('SilenceRatio')} />
                         <Th label={t('RiskLevel')} />
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {wards.map((ward, idx) => (
                         <tr 
                           key={idx} 
                           onClick={() => setSelectedWard(ward)}
                           className={`hover:bg-bg/50 transition-all cursor-pointer group ${selectedWard?.name === ward.name ? 'bg-bg' : ''}`}
                         >
                            <td className="py-8 px-10">
                               <div className="flex items-center gap-4">
                                  <MapPin size={18} className="text-navy opacity-30" />
                                  <span className="text-sm font-extrabold text-navy uppercase tracking-tighter">{ward.name}</span>
                               </div>
                            </td>
                            <td className="py-8 font-bold text-navy opacity-60 text-xs">{ward.population.toLocaleString()}</td>
                            <td className="py-8 font-bold text-navy opacity-60 text-xs">{ward.complaints} {t('Filed')}</td>
                            <td className="py-8">
                               <div className="flex flex-col">
                                  <span className="text-xs font-black text-navy opacity-80">1:{ward.ratio.toLocaleString()}</span>
                                  <div className="w-24 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                     <div className={`h-full ${ward.color}`} style={{ width: `${Math.min(100, (ward.ratio/5000) * 100)}%` }} />
                                  </div>
                               </div>
                            </td>
                            <td className="py-8">
                               <div className={`px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest inline-block ${ward.color}`}>
                                  {t(ward.risk)}
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>

          {/* Intervention Sidebar */}
          <div className="lg:col-span-4 h-full">
             {selectedWard ? (
                <div className="bg-navy rounded-[3.5rem] p-10 text-white shadow-2xl h-full space-y-10 animate-slide-in-right border border-[#162F6A]">
                   <div className="space-y-2">
                      <h3 className="text-2xl font-sora font-extrabold uppercase tracking-tight text-saffron">{selectedWard.name} {t('Intervention')}</h3>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">{t('MitigationActive')}</p>
                   </div>

                   <div className="space-y-6">
                      <ActionCard id="1" icon={<Users2 size={18}/>} title="Deploy Field Survey" desc="Authorize 2-person team to assess ground reality in Dharavi Cluster 4." />
                      <ActionCard id="2" icon={<Phone size={18}/>} title="Enable IVR Intake" desc="Deploy 1800-UGIRP hotline specific to the Dharavi node." />
                      <ActionCard id="3" icon={<ShieldAlert size={18}/>} title="Partner with NGO" desc="Initiate data-exchange with local Dharavi NGO network." />
                      <ActionCard id="4" icon={<MapPin size={18}/>} title="Install Kiosks" desc="Enable physical complaint kiosks at municipal offices." />
                   </div>

                   <div className="pt-8 border-t border-white/10 italic text-[10px] font-medium opacity-40">
                      {t('AuthorizingMsg')}
                   </div>
                </div>
             ) : (
                <div className="h-full bg-white rounded-[3.5rem] border-4 border-dashed border-[#162F6A]/30 flex flex-col items-center justify-center p-10 text-center opacity-40">
                   <HelpCircle size={64} className="mb-4 text-navy" />
                   <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('SelectWardNode')}</h3>
                   <p className="text-xs font-bold uppercase tracking-widest mt-2">{t('SelectWardDesc')}</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

function ActionCard({ id, icon, title, desc }) {
   const [status, setStatus] = useState('UNASSIGNED');

   const handleAssign = () => {
      setStatus('ASSIGNED');
      // Mock log
   };

   return (
      <div className={`p-6 rounded-2xl border transition-all ${status === 'ASSIGNED' ? 'bg-emerald border-emerald shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
         <div className="flex justify-between items-start mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'ASSIGNED' ? 'bg-white text-emerald' : 'bg-white/10 text-saffron'}`}>
               {icon}
            </div>
            <button 
               onClick={handleAssign}
               disabled={status === 'ASSIGNED'}
               className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-white/20 hover:bg-white hover:text-navy transition ${status === 'ASSIGNED' ? 'bg-white text-emerald' : ''}`}
            >
               {status}
            </button>
         </div>
         <h4 className="text-xs font-black uppercase tracking-tight mb-2">{title}</h4>
         <p className="text-[10px] opacity-60 leading-relaxed italic">{desc}</p>
      </div>
   );
}

function Th({ label }) {
   return <th className="py-6 px-10 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 italic">{label}</th>;
}