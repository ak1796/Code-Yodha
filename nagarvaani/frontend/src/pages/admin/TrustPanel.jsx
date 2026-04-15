import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, TrendingDown, Minus, ShieldAlert, Zap, 
  Droplets, Trash2, Construction, Activity, Award,
  Heart, Leaf, Building2, Bug, Zap as Electricity, 
  FileCheck, Factory, School, BarChart3, Activity as Pulse
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  { id: 'drainage', name: 'Drainage', score: 34, color: '#FF3B30', trend: 'down', icon: <Droplets />, res: '41%', sla: '28%', rating: '2.9/5' },
  { id: 'water', name: 'Water', score: 71, color: '#34C759', trend: 'up', icon: <Droplets />, res: '78%', sla: '69%', rating: '4.1/5' },
  { id: 'roads', name: 'Roads', score: 44, color: '#FF9500', trend: 'flat', icon: <Construction />, res: '52%', sla: '38%', rating: '3.4/5' },
  { id: 'garbage', name: 'Garbage', score: 68, color: '#007AFF', trend: 'up', icon: <Trash2 />, res: '65%', sla: '58%', rating: '3.9/5' },
  { id: 'storm', name: 'Storm Drain', score: 52, color: '#5856D6', trend: 'flat', icon: <Droplets />, res: '48%', sla: '45%', rating: '3.1/5' },
  { id: 'health', name: 'Health', score: 82, color: '#AF52DE', trend: 'up', icon: <Heart />, res: '88%', sla: '82%', rating: '4.5/5' },
  { id: 'garden', name: 'Garden', score: 59, color: '#2ECC71', trend: 'up', icon: <Leaf />, res: '61%', sla: '54%', rating: '3.7/5' },
  { id: 'buildings', name: 'Buildings', score: 40, color: '#8E8E93', trend: 'down', icon: <Building2 />, res: '38%', sla: '31%', rating: '2.8/5' },
  { id: 'pest', name: 'Pest Control', score: 74, color: '#FFCC00', trend: 'up', icon: <Bug />, res: '72%', sla: '68%', rating: '4.0/5' },
  { id: 'encroach', name: 'Encroach', score: 31, color: '#FF3B30', trend: 'down', icon: <ShieldAlert />, res: '33%', sla: '24%', rating: '2.5/5' },
  { id: 'elec', name: 'Electricity', score: 65, color: '#FF9522', trend: 'flat', icon: <Electricity />, res: '67%', sla: '59%', rating: '3.8/5' },
  { id: 'licence', name: 'Licence', score: 48, color: '#5AC8FA', trend: 'down', icon: <FileCheck />, res: '45%', sla: '42%', rating: '3.2/5' },
  { id: 'factories', name: 'Factories', score: 55, color: '#34495E', trend: 'flat', icon: <Factory />, res: '51%', sla: '47%', rating: '3.3/5' },
  { id: 'school', name: 'School', score: 88, color: '#D35400', trend: 'up', icon: <School />, res: '91%', sla: '87%', rating: '4.7/5' },
];

const MOCK_HISTORY = [
  { day: 'MON', drainage: 30, water: 65, roads: 42, garbage: 60, storm: 50, health: 80, garden: 55, buildings: 40, pest: 70, encroach: 32, elec: 62, licence: 45, factories: 50, school: 85 },
  { day: 'TUE', drainage: 32, water: 68, roads: 45, garbage: 62, storm: 52, health: 82, garden: 58, buildings: 42, pest: 72, encroach: 35, elec: 65, licence: 48, factories: 52, school: 88 },
  { day: 'WED', drainage: 35, water: 72, roads: 44, garbage: 65, storm: 55, health: 85, garden: 60, buildings: 44, pest: 75, encroach: 38, elec: 68, licence: 52, factories: 55, school: 91 },
  { day: 'THU', drainage: 34, water: 75, roads: 44, garbage: 68, storm: 52, health: 88, garden: 62, buildings: 44, pest: 78, encroach: 37, elec: 68, licence: 52, factories: 55, school: 85 },
  { day: 'FRI', drainage: 33, water: 73, roads: 45, garbage: 70, storm: 50, health: 80, garden: 63, buildings: 45, pest: 80, encroach: 33, elec: 70, licence: 55, factories: 58, school: 82 },
  { day: 'SAT', drainage: 31, water: 71, roads: 44, garbage: 72, storm: 48, health: 82, garden: 65, buildings: 40, pest: 82, encroach: 31, elec: 72, licence: 52, factories: 52, school: 80 },
  { day: 'SUN', drainage: 29, water: 71, roads: 44, garbage: 75, storm: 45, health: 84, garden: 68, buildings: 44, pest: 85, encroach: 29, elec: 71, licence: 50, factories: 50, school: 78 },
];

export default function TrustPanel() {
  const { t } = useTranslation();
  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in relative max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center shadow-2xl">
                 <Pulse size={24} />
              </div>
              <div>
                 <h1 className="text-4xl font-sora font-black text-navy tracking-tighter uppercase leading-none">Bureaucratic Trust HQ</h1>
                 <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-[0.3em] mt-1 italic">Algorithmic Accountability & Trust Scoring (AATS) Meta-Grid.</p>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-3xl shadow-soft border border-border">
           <Award size={24} className="text-saffron" />
           <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 leading-none">Global Accuracy Index</span>
              <p className="text-lg font-black text-navy leading-none mt-1 uppercase tracking-tighter">94.2% TRUSTED</p>
           </div>
        </div>
      </header>

      {/* Trust Score Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
         {DEPARTMENTS.map(dept => (
           <DepartmentCard key={dept.id} dept={dept} />
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Optimized Stacked Matrix */}
         <div className="lg:col-span-12 bg-white rounded-[3.5rem] p-12 shadow-soft border border-border relative overflow-hidden group">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-12 gap-8 relative z-10">
               <div>
                  <h3 className="text-2xl font-sora font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                     <BarChart3 className="text-navy opacity-20" /> Jurisdictional Trust Matrix
                  </h3>
                  <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest mt-1 italic">Normalized Stacked Regression • All 14 Municipal Signals</p>
               </div>
               <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end max-w-xl">
                  {DEPARTMENTS.slice(0, 7).map(d => (
                     <div key={d.id} className="flex items-center gap-1.5 text-[8px] font-black uppercase" style={{color: d.color}}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: d.color}} /> {d.id}
                     </div>
                  ))}
               </div>
            </div>
            
            <div className="h-[500px] relative z-0 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_HISTORY} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#0D1B40', opacity: 0.3}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#0D1B40', opacity: 0.3}} />
                     <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)'}}
                        itemStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}
                        cursor={{fill: '#f8f9fc'}}
                     />
                     {DEPARTMENTS.map(d => (
                        <Bar 
                           key={d.id}
                           dataKey={d.id} 
                           stackId="a" 
                           fill={d.color} 
                           radius={[2, 2, 2, 2]}
                           barSize={40}
                        />
                     ))}
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-navy/5 rounded-full blur-[100px] transition-transform group-hover:scale-125 duration-1000" />
         </div>
      </div>

      <div className="p-10 bg-navy rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
         <div className="relative z-10 max-w-xl">
            <h3 className="text-xl font-sora font-extrabold uppercase tracking-tight text-saffron mb-4 italic">Strategic AATS Intervention</h3>
            <p className="text-sm font-medium opacity-60 leading-relaxed italic">The Jurisdictional Stack indicates a severe imbalance on the Encroachment & Drainage vectors. Recommend immediate administrative override for Ward F/North Node.</p>
         </div>
         <button 
           onClick={() => toast.success("Dispatching Municipal Commissioner Intervention...")}
           className="relative z-10 bg-white text-navy px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition shadow-xl shrink-0"
         >
            Escalate to Municipal Commissioner
         </button>
         <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-saffron/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

function DepartmentCard({ dept }) {
   return (
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
         <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-2.5 rounded-xl text-white shadow-lg transition-transform group-hover:rotate-12`} style={{backgroundColor: dept.color}}>
               {React.cloneElement(dept.icon, { size: 14 })}
            </div>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
               dept.trend === 'up' ? 'bg-emerald/10 text-emerald' : dept.trend === 'down' ? 'bg-crimson/10 text-crimson' : 'bg-gray-100 text-gray-400'
            }`}>
               {dept.trend === 'up' ? <TrendingUp size={10}/> : dept.trend === 'down' ? <TrendingDown size={10}/> : <Minus size={10}/>}
               {dept.score}
            </div>
         </div>

         <div className="relative z-10 mb-4">
            <h4 className="text-[7px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 mb-1 leading-none truncate">{dept.name}</h4>
            <div className="flex items-end gap-1 font-sora">
               <span className="text-2xl font-black tracking-tighter leading-none" style={{color: dept.color}}>{dept.score}</span>
               <span className="text-[8px] font-bold text-navy mb-0.5 opacity-20">/100</span>
            </div>
         </div>

         <div className="space-y-2 pt-3 border-t border-border relative z-10">
            <MetricRow label="Res" val={dept.res} />
            <MetricRow label="SLA" val={dept.sla} />
         </div>
         
         <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-gray-50 rounded-full blur-[30px] group-hover:bg-navy/5 transition-colors" />
      </div>
   );
}

function MetricRow({ label, val }) {
   return (
      <div className="flex justify-between items-center text-[8px] font-bold">
         <span className="text-text-secondary uppercase tracking-widest opacity-30">{label}</span>
         <span className="text-navy">{val}</span>
      </div>
   );
}
