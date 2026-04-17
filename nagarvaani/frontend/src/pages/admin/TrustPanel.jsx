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
  FileCheck, Factory, School, BarChart3, Activity as Pulse, RefreshCw
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

const MOCK_FALLBACK = [
  { day: 'MON', drainage: 45, water: 82, roads: 34, garbage: 65, storm: 21, health: 12, garden: 9, buildings: 15, pest: 8, encroach: 22, elec: 42, licence: 11, factories: 5, school: 3 },
  { day: 'TUE', drainage: 52, water: 75, roads: 41, garbage: 70, storm: 18, health: 15, garden: 8, buildings: 20, pest: 12, encroach: 18, elec: 38, licence: 14, factories: 7, school: 2 },
  { day: 'WED', drainage: 38, water: 88, roads: 29, garbage: 60, storm: 25, health: 10, garden: 12, buildings: 18, pest: 9, encroach: 30, elec: 45, licence: 12, factories: 6, school: 4 },
  { day: 'THU', drainage: 60, water: 65, roads: 45, garbage: 55, storm: 30, health: 18, garden: 7, buildings: 22, pest: 15, encroach: 25, elec: 50, licence: 16, factories: 8, school: 5 },
  { day: 'FRI', drainage: 42, water: 90, roads: 32, garbage: 75, storm: 22, health: 14, garden: 15, buildings: 16, pest: 10, encroach: 20, elec: 40, licence: 10, factories: 4, school: 6 },
  { day: 'SAT', drainage: 30, water: 95, roads: 25, garbage: 80, storm: 15, health: 8, garden: 20, buildings: 12, pest: 5, encroach: 15, elec: 35, licence: 8, factories: 3, school: 8 },
  { day: 'SUN', drainage: 25, water: 100, roads: 20, garbage: 85, storm: 10, health: 5, garden: 25, buildings: 10, pest: 4, encroach: 12, elec: 30, licence: 6, factories: 2, school: 10 },
];

export default function TrustPanel() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalTrust, setGlobalTrust] = useState(0);

  useEffect(() => {
    fetchTrustData();
  }, []);

  const fetchTrustData = async () => {
    setLoading(true);
    try {
      const { data: tickets, error: ticketError } = await supabase.from('master_tickets').select('category, status, sla_deadline, created_at');
      
      if (ticketError) {
         console.error("Supabase Tickets Error:", ticketError);
      }
      const deptStats = {};
      const CATEGORIES = [
        { id: 'drainage', name: 'DRAINAGE', icon: <Droplets />, color: '#FF3B30' },
        { id: 'water', name: 'WATER SUPPLY', icon: <Droplets />, color: '#34C759' },
        { id: 'roads', name: 'ROADS AND TRAFFIC', icon: <Construction />, color: '#FF9500' },
        { id: 'garbage', name: 'SOLID WASTE MANAGEMENT', icon: <Trash2 />, color: '#007AFF' },
        { id: 'health', name: 'HEALTH', icon: <Heart />, color: '#AF52DE' },
        { id: 'garden', name: 'GARDEN', icon: <Leaf />, color: '#2ECC71' },
        { id: 'buildings', name: 'BUILDINGS', icon: <Building2 />, color: '#8E8E93' },
        { id: 'pest', name: 'PEST CONTROL', icon: <Bug />, color: '#FFCC00' },
        { id: 'encroach', name: 'ENCHROACHMENT', icon: <ShieldAlert />, color: '#FF3B30' },
        { id: 'elec', name: 'ELECTRICITY', icon: <Electricity />, color: '#FF9522' },
        { id: 'licence', name: 'LICENCE', icon: <FileCheck />, color: '#5AC8FA' },
        { id: 'factories', name: 'FACTORIES', icon: <Factory />, color: '#34495E' },
        { id: 'school', name: 'SCHOOL', icon: <School />, color: '#D35400' },
        { id: 'storm', name: 'STORM DRAINAGE', icon: <Droplets />, color: '#5856D6' }
      ];

      CATEGORIES.forEach(c => {
         const dTickets = tickets?.filter(t => t.category === c.name) || [];
         const total = dTickets.length;
         
         if (total === 0) {
            // Fallback to static baseline if no historical data from citizens yet
            const mock = DEPARTMENTS.find(d => d.id === c.id);
            deptStats[c.id] = { ...c, ...(mock || {}), score: mock?.score || 0 };
         } else {
            const resolved = dTickets.filter(t => t.status === 'resolved').length;
            const slaOk = dTickets.filter(t => t.status === 'resolved' && new Date(t.created_at || Date.now()) < new Date(t.sla_deadline)).length;
            
            const resRate = resolved / total;
            const slaRate = resolved > 0 ? (slaOk / resolved) : 0;
            const score = Math.round(resRate * 40 + slaRate * 30 + 30);

            deptStats[c.id] = {
              ...c,
              score,
              res: `${Math.round(resRate * 100)}%`,
              sla: `${Math.round(slaRate * 100)}%`,
              trend: score > 50 ? 'up' : 'down'
            };
         }
      });

      const avgTrust = Object.values(deptStats).length > 0 
        ? Math.round(Object.values(deptStats).reduce((acc, curr) => acc + curr.score, 0) / Object.values(deptStats).length)
        : 0;

      setDepartments(Object.values(deptStats));
      setGlobalTrust(avgTrust);

      // Fetch Real History from Analytics API
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/complaints/analytics/weekly-matrix`);
        const hData = await response.json();
        if (hData && Array.isArray(hData) && hData.length > 0) {
            setHistory(hData);
        } else {
            setHistory(MOCK_FALLBACK);
        }
      } catch (e) {
        console.error("Historical fetch failed, using fallback:", e);
        setHistory(MOCK_FALLBACK);
      }
    } catch (err) {
      console.error("Trust fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in relative max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center shadow-2xl">
                 <Pulse size={24} />
              </div>
              <div>
                 <h1 className="text-4xl font-sora font-black text-navy tracking-tighter uppercase leading-none">{t('TrustHQ')}</h1>
                 <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-[0.3em] mt-1 italic">{t('TrustSubHeader')}</p>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-3xl shadow-soft border border-[#162F6A]/30">
           <Award size={24} className="text-saffron" />
           <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{t('AccuracyIndex')}</span>
              <p className="text-lg font-black text-navy leading-none mt-1 uppercase tracking-tighter">{globalTrust}% {t('TRUSTED')}</p>
           </div>
        </div>
      </header>

      {/* Trust Score Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 min-h-[400px]">
         {loading ? (
           <div className="col-span-full flex flex-col items-center justify-center p-20 opacity-20">
              <RefreshCw className="animate-spin mb-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Aggregating Global Performance Matrix...</span>
           </div>
         ) : departments.map(dept => (
           <DepartmentCard key={dept.id} dept={dept} />
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Optimized Stacked Matrix */}
         <div className="lg:col-span-12 bg-white rounded-[3.5rem] p-12 shadow-soft border border-[#162F6A]/30 relative overflow-hidden group">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-12 gap-8 relative z-10">
               <div>
                  <h3 className="text-2xl font-sora font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                     <BarChart3 className="text-navy opacity-20" /> Jurisdictional Trust Matrix
                  </h3>
                  <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest mt-1 italic">Normalized Stacked Regression â€¢ All 14 Municipal Signals</p>
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
                  <BarChart data={history.length > 0 ? history : MOCK_FALLBACK} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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

      <div className="p-10 bg-navy rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden border border-[#162F6A]">
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
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#162F6A]/30 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
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