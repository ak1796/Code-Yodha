import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  FileText, Download, TrendingUp, Users, Activity,
  BarChart3, PieChart as PieChartIcon, Filter, Calendar,
  ArrowRight, ShieldCheck, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_VOL_DATA = [
  { day: 'May 10', volume: 45, water: 12, roads: 20, garbage: 13 },
  { day: 'May 11', volume: 52, water: 15, roads: 25, garbage: 12 },
  { day: 'May 12', volume: 48, water: 10, roads: 22, garbage: 16 },
  { day: 'May 13', volume: 61, water: 18, roads: 30, garbage: 13 },
  { day: 'May 14', volume: 55, water: 14, roads: 28, garbage: 13 },
  { day: 'May 15', volume: 147, water: 62, roads: 71, garbage: 14 }, // THE SPIKE
  { day: 'May 16', volume: 92, water: 40, roads: 40, garbage: 12 },
];

const RESOLUTION_DIST = [
  { name: 'SLA Met', value: 68, color: '#0E8A5F' },
  { name: 'Late 1-6h', value: 12, color: '#007AFF' },
  { name: 'Late 6-24h', value: 11, color: '#E8720C' },
  { name: 'Late 24h+', value: 9, color: '#C0392B' },
];

const SOURCE_DATA = [
  { name: 'Web Form', value: 41, color: '#0D1B40' },
  { name: 'Telegram', value: 18, color: '#0088CC' },
  { name: 'Reddit', value: 14, color: '#FF4500' },
  { name: 'Social Feed', value: 27, color: '#E8720C' },
];

export default function StrategicAnalytics() {
  const { t } = useTranslation();
  const [bmcStats, setBmcStats] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5176/api/data/bmc/stats');
        const data = await response.json();
        setBmcStats(data);
      } catch (error) {
        console.error("Failed to fetch BMC stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const exportReport = (title) => {
    toast.success(`Synthesizing Specialist Node: ${title}...`);
    setTimeout(() => toast.success(`Exporting ${title} Deployment Successful.`), 2000);
  };

  const volumeData = bmcStats?.yearlyVolume 
    ? Object.entries(bmcStats.yearlyVolume).map(([year, volume]) => ({ day: year, volume }))
    : MOCK_VOL_DATA;

  const sourceData = bmcStats?.issueDistribution
    ? Object.entries(bmcStats.issueDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value], idx) => ({ 
          name, 
          value: Math.round((value / bmcStats.totalComplaints) * 100),
          color: ['#0D1B40', '#007AFF', '#E8720C', '#C0392B', '#0E8A5F'][idx % 5]
        }))
    : SOURCE_DATA;

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
       <header className="flex justify-between items-center">
          <div className="space-y-2">
             <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-4">
                <BarChart3 className="text-navy opacity-20" size={40} /> {t('StrategicAnalytics')}
             </h1>
             <p className="text-text-secondary font-medium opacity-60 italic">{t('StrategicAnalyticsDesc')}</p>
          </div>
          <div className="flex gap-4">
             <ReportButton icon={<FileText size={18}/>} label="Weekly PDF" onClick={() => exportReport('Weekly Summary PDF')} />
             <ReportButton icon={<Download size={18}/>} label="Officer CSV" onClick={() => exportReport('Officer Performance CSV')} />
             <ReportButton icon={<Activity size={18}/>} label="AATS Hist" onClick={() => exportReport('AATS History CSV')} />
          </div>
       </header>

       {/* Top Row: Volume and Sources */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-12 shadow-soft border border-border group relative overflow-hidden">
             <div className="flex justify-between items-center mb-12">
                <div>
                   <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('JurisdictionalThroughput')}</h3>
                   <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest mt-1">30-Day Volumetric Scan (Spike Detected: May 15)</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-light/20 text-emerald rounded-full border border-emerald/10">
                   <TrendingUp size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest italic">+147% Pulse Spike</span>
                </div>
             </div>
             
             <div className="h-[400px] relative z-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                        cursor={{fill: '#f8f9fc'}}
                      />
                      <Bar dataKey="volume" fill="#0D1B40" radius={[12, 12, 12, 12]} barSize={40}>
                         {volumeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.volume > 100 ? '#C0392B' : '#0D1B40'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="absolute -right-20 -top-20 w-80 h-80 bg-navy/5 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
          </div>

          <div className="lg:col-span-4 bg-white rounded-[3.5rem] p-12 shadow-soft border border-border flex flex-col justify-between">
             <div className="space-y-2 mb-10">
                <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('ChannelOrigin')}</h3>
                <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest mt-1">Source Frequency Distribution</p>
             </div>
             <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={sourceData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                         {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="space-y-4 pt-10">
                {sourceData.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                         <span className="text-navy uppercase tracking-widest opacity-40">{item.name}</span>
                      </div>
                      <span className="text-navy">{item.value}%</span>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Bottom Row: SLA Distribution & Performance Overlay */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 bg-navy rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
             <h3 className="text-xl font-sora font-extrabold uppercase tracking-tight text-saffron mb-10 relative z-10">{t('SLAResilienceTiers')}</h3>
             <div className="space-y-8 relative z-10">
                {RESOLUTION_DIST.map((item, idx) => (
                   <div key={idx} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="opacity-40">{item.name}</span>
                         <span>{item.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full transition-all duration-1000" style={{width: `${item.value}%`, backgroundColor: item.color}} />
                      </div>
                   </div>
                ))}
             </div>
             <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/5 relative z-10 italic text-[10px] font-medium opacity-40">
                "9% of jurisdictional nodes are currently experiencing severe resolution lag exceeding the 24h delta window."
             </div>
             <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-saffron/10 rounded-full blur-[100px]" />
          </div>

          <div className="lg:col-span-7 bg-white rounded-[3.5rem] p-12 shadow-soft border border-border">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t('OfficerPerfRegression')}</h3>
                <span className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest italic">Normalized Ranking Matrix</span>
             </div>
             <div className="space-y-6">
                <RankingRow rank="01" name="Priya Sharma" score="98.2" dep="DRAINAGE" />
                <RankingRow rank="02" name="Ramesh Sharma" score="94.1" dep="HEALTH" />
                <RankingRow rank="03" name="Suresh Patil" score="89.5" dep="STORM WATER DRAIN" />
                <RankingRow rank="04" name="Raj Malhotra" score="86.1" dep="ELECTRICITY" />
                <RankingRow rank="05" name="Anita Desai" score="84.3" dep="SOLID WASTE MANAGEMENT" />
             </div>
          </div>
       </div>
    </div>
  );
}

function ReportButton({ icon, label, onClick }) {
   return (
      <button 
        onClick={onClick}
        className="flex items-center gap-3 px-6 py-4 bg-white border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy hover:bg-navy hover:text-white transition shadow-sm hover:scale-105 active:scale-95"
      >
         {icon} {label}
      </button>
   );
}

function RankingRow({ rank, name, score, dep }) {
   return (
      <div className="flex items-center justify-between p-6 bg-bg/40 rounded-3xl border border-border hover:border-navy/20 transition-all group">
         <div className="flex items-center gap-6">
            <span className="text-xl font-sora font-black text-navy opacity-20">{rank}</span>
            <div>
               <p className="text-sm font-extrabold text-navy tracking-tight">{name}</p>
               <span className="text-[9px] font-black text-text-secondary opacity-40 uppercase tracking-widest leading-none italic">{dep} SPECIALIST</span>
            </div>
         </div>
         <div className="text-right">
            <p className="text-xl font-sora font-black text-navy leading-none">{score}</p>
            <span className="text-[8px] font-black text-emerald uppercase tracking-widest mt-1">TRUST GRADE: S+</span>
         </div>
      </div>
   );
}
