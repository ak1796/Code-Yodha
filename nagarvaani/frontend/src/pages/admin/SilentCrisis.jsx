import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EyeOff, MapPin, Users, Phone, Users2,
  HelpCircle, ChevronRight, AlertTriangle,
  ShieldAlert, Activity, CheckCircle, MessageSquare
} from 'lucide-react';

const WARDS = [
  { name: "Dharavi", population: 600000, complaints: 6, ratio: 100000, risk: "CRITICAL", color: "bg-crimson" },
  { name: "Govandi", population: 400000, complaints: 4, ratio: 100000, risk: "CRITICAL", color: "bg-crimson" },
  { name: "Mankhurd", population: 180000, complaints: 22, ratio: 8181, risk: "HIGH", color: "bg-saffron" },
  { name: "Bandra West", population: 120000, complaints: 180, ratio: 667, risk: "MEDIUM", color: "bg-yellow-400" },
  { name: "Colaba", population: 80000, complaints: 240, ratio: 333, risk: "LOW", color: "bg-emerald" },
];

export default function SilentCrisis() {
  const [selectedWard, setSelectedWard] = useState(null);
  const { t } = useTranslation();

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
       <header className="flex justify-between items-center">
          <div className="space-y-2">
             <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-4">
                <EyeOff className="text-navy opacity-20" size={40} /> Silent Crisis Matrix
             </h1>
             <p className="text-text-secondary font-medium opacity-60 italic">Algorithmic Identification of Under-served Municipal Wards.</p>
          </div>
          <div className="bg-white px-8 py-4 rounded-3xl shadow-soft border border-border flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-crimson text-white flex items-center justify-center shadow-lg shadow-crimson/20">
                <AlertTriangle size={20} />
             </div>
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">Global Blind Spots</span>
                <p className="text-sm font-extrabold text-navy uppercase tracking-tighter">02 Critical Nodes</p>
             </div>
          </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Ward Table */}
          <div className="lg:col-span-8 bg-white rounded-[3.5rem] shadow-soft border border-border overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b border-border bg-bg/30">
                      <Th label="Ward Jurisdictions" />
                      <Th label="Population" />
                      <Th label="Complaints" />
                      <Th label="Silence Ratio" />
                      <Th label="Risk Level" />
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {WARDS.map((ward, idx) => (
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
                         <td className="py-8 font-bold text-navy opacity-60 text-xs">{ward.complaints} Filed</td>
                         <td className="py-8">
                            <div className="flex flex-col">
                               <span className="text-xs font-black text-navy opacity-80">1:{ward.ratio.toLocaleString()}</span>
                               <div className="w-24 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                  <div className="h-full bg-crimson" style={{ width: `${Math.min(100, (ward.ratio/1000))}%` }} />
                               </div>
                            </div>
                         </td>
                         <td className="py-8">
                            <div className={`px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest inline-block ${ward.color}`}>
                               {ward.risk}
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* Intervention Sidebar */}
          <div className="lg:col-span-4 h-full">
             {selectedWard ? (
                <div className="bg-navy rounded-[3.5rem] p-10 text-white shadow-2xl h-full space-y-10 animate-slide-in-right">
                   <div className="space-y-2">
                      <h3 className="text-2xl font-sora font-extrabold uppercase tracking-tight text-saffron">{selectedWard.name} Intervention</h3>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Mitigation Protocol ACTIVE</p>
                   </div>

                   <div className="space-y-6">
                      <ActionCard id="1" icon={<Users2 size={18}/>} title="Deploy Field Survey" desc="Authorize 2-person team to assess ground reality in Dharavi Cluster 4." />
                      <ActionCard id="2" icon={<Phone size={18}/>} title="Enable IVR Intake" desc="Deploy 1800-UGIRP hotline specific to the Dharavi node." />
                      <ActionCard id="3" icon={<ShieldAlert size={18}/>} title="Partner with NGO" desc="Initiate data-exchange with local Dharavi NGO network." />
                      <ActionCard id="4" icon={<MapPin size={18}/>} title="Install Kiosks" desc="Enable physical complaint kiosks at municipal offices." />
                   </div>

                   <div className="pt-8 border-t border-white/10 italic text-[10px] font-medium opacity-40">
                      Authorizing an action will log the task in the Field Operative Ledger and assign a tactical unit within 2 hours.
                   </div>
                </div>
             ) : (
                <div className="h-full bg-white rounded-[3.5rem] border-4 border-dashed border-border flex flex-col items-center justify-center p-10 text-center opacity-40">
                   <HelpCircle size={64} className="mb-4 text-navy" />
                   <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">Select Ward Node</h3>
                   <p className="text-xs font-bold uppercase tracking-widest mt-2">To view recommended crisis interventions.</p>
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
