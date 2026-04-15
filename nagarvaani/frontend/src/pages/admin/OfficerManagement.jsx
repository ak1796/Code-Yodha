import { useTranslation } from 'react-i18next';
import { 
  Users, MapPin, Search, Filter, Plus, 
  MoreHorizontal, ToggleRight, ToggleLeft, 
  Mail, Settings, ChevronRight, Activity, RefreshCcw, 
  AlertTriangle, Trash2, UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OfficerManagement() {
  const { t } = useTranslation();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL');

  useEffect(() => {
    fetchOfficers();
    // Real-Time Neural Sync
    const sub = supabase.channel('officer-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchOfficers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_tickets' }, fetchOfficers)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    // Fetch profiles first
    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'officer');
    
    if (pErr) return toast.error("Specialist Sync Failed");

    // Fetch active ticket counts for each officer
    const { data: counts, error: cErr } = await supabase
      .from('master_tickets')
      .select('assigned_officer_id, status');

    if (cErr) return toast.error("Metric Ingestion Failed");

    const officerData = (profs || []).map(off => ({
      ...off,
      active_ticket_count: (counts || []).filter(t => t.assigned_officer_id === off.id && t.status !== 'resolved').length
    }));

    setOfficers(officerData);
    setLoading(false);
  };

  const toggleAvailability = async (id, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: !currentStatus })
      .eq('id', id);
    
    if (error) toast.error("Jurisdictional override failed");
    else {
      toast.success(`Officer ${!currentStatus ? 'Activated' : 'Suspended'}`);
      fetchOfficers();
    }
  };

  const handleUpdate = async (id, updates) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    
    if (error) toast.error("Jurisdictional sync failed");
    else {
      toast.success("Specialist Profile Synchronized");
      fetchOfficers();
      setSelectedOfficer(null);
    }
  };

  const reassignAll = async (id, name) => {
     if (window.confirm(`Reassign all active tickets from ${name}?`)) {
        const { error } = await supabase
          .from('master_tickets')
          .update({ assigned_officer_id: null, status: 'filed' })
          .eq('assigned_officer_id', id)
          .neq('status', 'resolved');
        
        if (error) toast.error("Global Reassignment Failed");
        else {
          toast.success("incidents have been released to the general queue.");
          fetchOfficers();
        }
     }
  };

  const filteredOfficers = officers.filter(off => {
    const matchesSearch = off.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          off.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          off.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterMode === 'HIGH') return matchesSearch && (off.active_ticket_count >= 5);
    if (filterMode === 'ANDHERI') return matchesSearch && (off.city?.toLowerCase().includes('andheri'));
    return matchesSearch;
  });

  return (
    <div className="p-10 lg:p-16 space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
       <header className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-soft border border-border">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-navy text-white flex items-center justify-center shadow-xl shadow-navy/20">
                <Users size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-sora font-extrabold text-navy tracking-tight uppercase">{t('SpecialistRoster')}</h1>
                <p className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-[0.3em] mt-1 italic">{t('LoadBalancingDesc')}</p>
             </div>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-navy text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition shadow-2xl"
          >
             <UserPlus size={18} /> {t('InductNewSpecialist')}
          </button>
       </header>

       <div className="bg-white rounded-[3.5rem] shadow-soft border border-border overflow-hidden">
          <div className="p-10 border-b border-border flex justify-between items-center bg-bg/50">
             <div className="relative w-full max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy opacity-30" />
                <input 
                  type="text" 
                  placeholder={t('SearchSpecialists')}
                  className="w-full bg-white border border-border rounded-2xl pl-12 pr-6 py-4 text-xs font-bold uppercase tracking-widest text-navy focus:ring-2 ring-navy/10 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex gap-4">
                <FilterButton active={filterMode === 'ALL'} label="All Specialist" onClick={() => setFilterMode('ALL')} />
                <FilterButton active={filterMode === 'HIGH'} label="High Capacity" onClick={() => setFilterMode('HIGH')} />
                <FilterButton active={filterMode === 'ANDHERI'} label="Andheri Group" onClick={() => setFilterMode('ANDHERI')} />
             </div>
          </div>

          <table className="w-full text-left">
             <thead className="bg-white">
                <tr className="border-b border-border">
                   <Th label={t('SpecialistProfile')} />
                   <Th label={t('Department')} />
                   <Th label={t('Jurisdiction')} />
                   <Th label={t('CapacityLoad')} />
                   <Th label={t('Status')} />
                   <Th label={t('Intervention')} />
                </tr>
             </thead>
             <tbody className="divide-y divide-border">
                {loading ? (
                   <tr><td colSpan={6} className="py-20 text-center animate-pulse text-navy font-bold uppercase tracking-widest text-xs">{t('SyncingGlobalRoster')}</td></tr>
                ) : filteredOfficers.map(off => (
                   <OfficerRow 
                     key={off.id} 
                     off={off} 
                     onToggle={() => toggleAvailability(off.id, off.is_available)} 
                     onReassign={() => reassignAll(off.id, off.full_name)}
                     onEdit={setSelectedOfficer}
                   />
                ))}
             </tbody>
          </table>
       </div>

       {showAddForm && (
         <AddOfficerModal onClose={() => setShowAddForm(false)} />
       )}

       {selectedOfficer && (
           <EditOfficerModal 
             off={selectedOfficer} 
             onClose={() => setSelectedOfficer(null)} 
             onUpdate={handleUpdate}
           />
        )}
    </div>
  );
}

function OfficerRow({ off, onToggle, onReassign, onEdit }) {
   const { t } = useTranslation();
   const load = off.active_ticket_count || 0;
   const capacityColor = load >= 8 ? 'bg-crimson/10 text-crimson border-crimson/20' : load >= 5 ? 'bg-saffron/10 text-saffron border-saffron/20' : 'bg-emerald/10 text-emerald border-emerald/20';
   
   return (
      <tr className={`hover:bg-bg/50 transition-colors group ${load >= 8 ? 'bg-crimson/[0.02]' : ''}`}>
         <td className="py-8 px-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-black text-xs border border-navy shadow-sm">
                  {off.full_name?.charAt(0)}
               </div>
               <div>
                  <p className="text-sm font-extrabold text-navy leading-none mb-1">{off.full_name}</p>
                  <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest leading-none italic">ID: {off.id.substring(0, 8)}</span>
               </div>
            </div>
         </td>
         <td className="py-8 text-xs font-black text-navy opacity-60 uppercase tracking-widest">{off.department}</td>
         <td className="py-8">
            <div className="flex items-center gap-2 text-navy opacity-60">
               <MapPin size={12} />
               <span className="text-[10px] font-black uppercase tracking-widest italic">{off.ward_name || off.city || 'Andheri West'}</span>
            </div>
         </td>
         <td className="py-8 px-6">
            <div className={`px-4 py-2 rounded-xl border flex items-center justify-between min-w-[100px] ${capacityColor}`}>
               <span className="text-[10px] font-black uppercase tracking-widest">{load}/10</span>
               <Activity size={12} className={load >= 8 ? 'animate-pulse' : ''} />
            </div>
         </td>
         <td className="py-8">
            <button onClick={onToggle} className="group relative">
               {off.is_available ? (
                 <div className="flex items-center gap-2 px-3 py-1 bg-emerald text-white rounded-full text-[8px] font-bold uppercase tracking-widest shadow-lg shadow-emerald/20">
                    <ToggleRight size={14} /> {t('Active')}
                 </div>
               ) : (
                 <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-400 rounded-full text-[8px] font-bold uppercase tracking-widest">
                    <ToggleLeft size={14} /> {t('AwayInactive')}
                 </div>
               )}
            </button>
         </td>
         <td className="py-8 px-10">
            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={onReassign} className="p-3 bg-navy/5 text-navy hover:bg-navy hover:text-white rounded-xl transition shadow-sm" title={t('GlobalReassignment')}>
                  <RefreshCcw size={16} />
               </button>
               <button onClick={() => onEdit(off)} className="p-3 bg-navy/5 text-navy hover:bg-navy hover:text-white rounded-xl transition shadow-sm" title={t('ManageProtocol')}>
                  <Settings size={16} />
               </button>
            </div>
         </td>
      </tr>
   );
}

function EditOfficerModal({ off, onClose, onUpdate }) {
   const { t } = useTranslation();
   const [formData, setFormData] = useState({
      full_name: off.full_name,
      department: off.department,
      city: off.city || 'Mumbai'
   });

   return (
      <div className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in text-navy">
         <div className="bg-white rounded-[3.5rem] w-full max-w-xl p-12 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-10 right-10 text-navy opacity-30 hover:opacity-100 transition"><RefreshCcw size={24} /></button>
             <h3 className="text-2xl font-sora font-extrabold uppercase tracking-tighter mb-10 border-b border-border pb-6 flex items-center gap-3">
               <Settings size={28} className="text-navy" /> {t('ManageProtocol')}
            </h3>
            <div className="space-y-6">
               <Input 
                 label={t('SpecialistProfile')} 
                 value={formData.full_name} 
                 onChange={e => setFormData({...formData, full_name: e.target.value})} 
               />
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 ml-2">{t('Department')}</p>
                     <select 
                       value={formData.department}
                       onChange={e => setFormData({...formData, department: e.target.value})}
                       className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none"
                     >
                        <option value="DRAINAGE">{t('DRAINAGE')}</option>
                        <option value="STORM WATER DRAIN">{t('STORM_WATER_DRAIN')}</option>
                        <option value="WATER SUPPLY">{t('WATER_SUPPLY')}</option>
                        <option value="ROADS AND TRAFFIC">{t('ROADS_AND_TRAFFIC')}</option>
                        <option value="SOLID WASTE MANAGEMENT">{t('SOLID_WASTE_MANAGEMENT')}</option>
                        <option value="HEALTH">{t('HEALTH')}</option>
                        <option value="GARDEN & TREE">{t('GARDEN_TREE')}</option>
                        <option value="BUILDINGS">{t('BUILDINGS')}</option>
                        <option value="PEST CONTROL">{t('PEST_CONTROL')}</option>
                        <option value="ENCROACHMENT">{t('ENCROACHMENT')}</option>
                        <option value="ELECTRICITY">{t('ELECTRICITY')}</option>
                        <option value="LICENCE">{t('LICENCE')}</option>
                        <option value="FACTORIES">{t('FACTORIES')}</option>
                        <option value="SCHOOL">{t('SCHOOL')}</option>
                     </select>
                  </div>
                  <Input 
                    label={t('Jurisdiction')} 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                  />
               </div>
               <button 
                 onClick={() => onUpdate(off.id, formData)}
                 className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition mt-8"
               >
                  {t('AuthorizeProfileOverride')}
               </button>
            </div>
         </div>
      </div>
   );
}

function Th({ label }) {
   return <th className="py-6 px-10 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 italic">{label}</th>;
}

function FilterButton({ label, active, onClick }) {
   return (
      <button 
        onClick={onClick}
        className={`px-5 py-3 border rounded-xl text-[9px] font-black uppercase tracking-widest transition shadow-sm ${
           active 
           ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20 scale-105' 
           : 'bg-white border-border text-navy/60 hover:text-navy hover:border-navy/20'
        }`}
      >
         {label}
      </button>
   );
}

function AddOfficerModal({ onClose }) {
   const { t } = useTranslation();
   const [formData, setFormData] = useState({
      full_name: '',
      department: 'WATER',
      city: 'Andheri West',
      email: ''
   });

   const handleAdd = async () => {
      const { error } = await supabase
        .from('profiles')
        .insert([{ ...formData, role: 'officer', is_available: true }]);
      
      if (error) toast.error("Deployment failed");
      else {
         toast.success("Specialist Successfully Inducted");
         onClose();
      }
   };

   return (
      <div className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
         <div className="bg-white rounded-[3.5rem] w-full max-w-xl p-12 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-10 right-10 text-navy opacity-30 hover:opacity-100 transition"><Activity size={24} /></button>
            <h3 className="text-2xl font-sora font-extrabold text-navy uppercase tracking-tighter mb-10 border-b border-border pb-6 flex items-center gap-3">
               <UserPlus size={24} /> {t('InductOfficer')}
            </h3>
            <div className="space-y-6">
               <Input label={t('OfficerFullName')} placeholder="e.g. Ramesh Sharma" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
               <Input label={t('AuthEmail')} placeholder="officer@municipal.gov.in" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 ml-2">{t('Department')}</p>
                     <select 
                       value={formData.department}
                       onChange={e => setFormData({...formData, department: e.target.value})}
                       className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none"
                     >
                        <option value="DRAINAGE">{t('DRAINAGE')}</option>
                        <option value="STORM WATER DRAIN">{t('STORM_WATER_DRAIN')}</option>
                        <option value="WATER SUPPLY">{t('WATER_SUPPLY')}</option>
                        <option value="ROADS AND TRAFFIC">{t('ROADS_AND_TRAFFIC')}</option>
                        <option value="SOLID WASTE MANAGEMENT">{t('SOLID_WASTE_MANAGEMENT')}</option>
                        <option value="HEALTH">{t('HEALTH')}</option>
                        <option value="GARDEN & TREE">{t('GARDEN_TREE')}</option>
                        <option value="BUILDINGS">{t('BUILDINGS')}</option>
                        <option value="PEST CONTROL">{t('PEST_CONTROL')}</option>
                        <option value="ENCROACHMENT">{t('ENCROACHMENT')}</option>
                        <option value="ELECTRICITY">{t('ELECTRICITY')}</option>
                        <option value="LICENCE">{t('LICENCE')}</option>
                        <option value="FACTORIES">{t('FACTORIES')}</option>
                        <option value="SCHOOL">{t('SCHOOL')}</option>
                     </select>
                  </div>
                  <Input label={t('WardNode')} placeholder="Andheri West" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
               </div>
               <button onClick={handleAdd} className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition mt-8">{t('RegisterSpecialistSendInvite')}</button>
            </div>
         </div>
      </div>
   );
}

function Input({ label, ...props }) {
   return (
      <div className="space-y-2">
         <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 ml-2">{label}</p>
         <input className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none" {...props} />
      </div>
   );
}
