import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Award, Search, UserPlus, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Officers() {
  const { t } = useTranslation();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOfficers = async () => {
      // Mock data for demonstration
      setOfficers([
        { id: '1', full_name: 'Inspector S. Patil', ward_id: 'Ward A', vote_weight: 1.0, email: 'patil@nagarvaani.gov.in', tickets_resolved: 42, sla_compliance: 92 },
        { id: '2', full_name: 'Eng. R. Sharma', ward_id: 'Ward B', vote_weight: 1.0, email: 'sharma@nagarvaani.gov.in', tickets_resolved: 38, sla_compliance: 88 },
        { id: '3', full_name: 'Dr. A. Khan', ward_id: 'Ward K-East', vote_weight: 1.2, email: 'khan@nagarvaani.gov.in', tickets_resolved: 56, sla_compliance: 95 }
      ]);
      setLoading(false);
    };
    fetchOfficers();
  }, []);

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex justify-between items-end bg-surface p-8 rounded-3xl shadow-soft border border-border">
           <div>
              <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight">{t('ManagedForce')}</h1>
              <p className="text-sm font-medium text-text-secondary mt-1 opacity-60">{t('ManagedForceDesc')}</p>
           </div>
           <button className="flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-navy-light transition shadow-xl">
              {t('AddNewOfficial')} <UserPlus size={18} />
           </button>
        </header>

        <section className="space-y-6">
           <div className="flex items-center gap-4 px-2">
              <div className="flex-1 relative group">
                 <Search size={18} className="absolute left-4 top-4 text-text-secondary group-focus-within:text-navy transition" />
                 <input 
                   type="text" 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   placeholder={t('SearchDirectory')} 
                   className="w-full pl-12 pr-4 py-4 border border-border rounded-2xl outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 text-sm font-bold transition"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {officers.map((officer) => (
                <div key={officer.id} className="bg-surface rounded-3xl p-8 border border-border shadow-soft hover:border-navy transition group">
                   <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-navy shadow-sm group-hover:bg-navy group-hover:text-white transition group-hover:scale-105 duration-300">
                         <User size={32} />
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-bold bg-emerald-light text-emerald px-2 py-1 rounded-full uppercase tracking-widest leading-none">{t('VettedActive')}</span>
                         <div className="flex items-center gap-1 mt-2 text-saffron justify-end">
                            <Award size={14} /> <span className="text-xs font-bold font-mono">MVP</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 mb-8">
                      <div>
                         <h3 className="text-xl font-sora font-extrabold text-navy underline decoration-saffron-light underline-offset-4">{officer.full_name}</h3>
                         <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1 opacity-60">ID: OFF_{officer.id?.substring(0, 8)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-navy">
                         <MapPin size={16} className="text-saffron shrink-0" /> {officer.ward_id || t('GlobalReserve')}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 border-y border-border py-6 mb-6">
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">SLA Score</p>
                         <p className="text-lg font-sora font-extrabold text-navy">{officer.sla_compliance || 90}%</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Resolved</p>
                         <p className="text-lg font-sora font-extrabold text-navy">{officer.tickets_resolved || 0}</p>
                      </div>
                   </div>

                   <div className="flex gap-2">
                      <button className="flex-1 bg-gray-50 text-navy py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-navy hover:text-white transition flex items-center justify-center gap-2">
                         Profile Detail
                      </button>
                      <button className="p-3 bg-gray-50 rounded-xl text-navy hover:bg-navy hover:text-white transition"><Mail size={16} /></button>
                      <button className="p-3 bg-gray-50 rounded-xl text-navy hover:bg-navy hover:text-white transition"><Phone size={16} /></button>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}
