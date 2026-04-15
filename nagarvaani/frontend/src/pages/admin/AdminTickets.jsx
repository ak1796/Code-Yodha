import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Filter, Search, ChevronRight, Clock, User, Shield, CheckCircle } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ city: 'ALL', department: 'ALL', status: 'ALL' });
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchTickets();

    // Activate Real-Time Neural Sync
    const channel = supabase
      .channel('admin-registry-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_tickets' }, () => {
        console.log("🔄 Real-time update detected in registry...");
        fetchTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    let query = supabase
      .from('master_tickets')
      .select('*, assigned_officer:profiles!assigned_officer_id(*)');

    if (filter.city !== 'ALL') query = query.eq('city', filter.city);
    if (filter.department !== 'ALL') query = query.eq('category', filter.department);
    if (filter.status !== 'ALL') query = query.eq('status', filter.status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load command registry");
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const filteredTickets = tickets.filter(t => 
    t.title?.toLowerCase().includes(search.toLowerCase()) || 
    t.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-8 bg-bg overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-sora font-extrabold text-navy">{t('MunicipalCommandRegistry')}</h1>
          <p className="text-text-secondary opacity-60">{t('CompleteOversight')}</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
            <input 
              type="text" 
              placeholder={t('SearchPlaceholder')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-navy/10 outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-8 flex-1 overflow-hidden">
        {/* Main List */}
        <div className="flex-1 bg-surface rounded-3xl border border-border shadow-soft overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-bg/20 flex gap-4">
            <select 
              value={filter.city} 
              onChange={(e) => setFilter({...filter, city: e.target.value})}
              className="bg-transparent text-xs font-bold uppercase tracking-widest text-navy outline-none"
            >
              <option value="ALL">{t('AllCities')}</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Nashik">Nashik</option>
              <option value="Thane">Thane</option>
            </select>
            <select 
              value={filter.department} 
              onChange={(e) => setFilter({...filter, department: e.target.value})}
              className="bg-transparent text-xs font-bold uppercase tracking-widest text-navy outline-none"
            >
              <option value="ALL">{t('AllDepts')}</option>
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

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-20 text-center animate-pulse text-text-secondary uppercase text-xs font-bold tracking-widest">
                Syncing Registry...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-20 text-center text-text-secondary uppercase text-xs font-bold tracking-widest">
                No tickets matching criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface/90 backdrop-blur-md z-10 border-b border-border">
                  <tr className="text-[10px] uppercase tracking-widest text-text-secondary">
                    <th className="px-6 py-4 font-bold">{t('TicketDetails')}</th>
                    <th className="px-6 py-4 font-bold">{t('Location')}</th>
                    <th className="px-6 py-4 font-bold">{t('AssignedTo')}</th>
                    <th className="px-6 py-4 font-bold">{t('Status')}</th>
                    <th className="px-6 py-4 font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTickets.map(ticket => (
                    <tr 
                      key={ticket.id} 
                      onClick={() => setSelectedTicket(ticket)}
                      className={`hover:bg-bg/40 cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-bg' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-navy line-clamp-1">{ticket.title}</span>
                          <span className="text-[10px] font-mono text-text-secondary uppercase mt-0.5">{ticket.id.slice(0,8)} • {ticket.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-navy">{ticket.city || 'Global'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.assigned_officer ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center text-[10px] font-bold text-navy">
                              {ticket.assigned_officer.full_name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-navy">{ticket.assigned_officer.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-crimson animate-pulse uppercase tracking-widest bg-crimson/5 px-2 py-0.5 rounded">{t('Unassigned')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight size={16} className="text-border group-hover:text-navy inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Side Panel: Detail View */}
        <div className="w-96 flex flex-col gap-6 h-full">
           {selectedTicket ? (
             <div className="flex-1 bg-navy rounded-3xl p-6 text-white overflow-y-auto custom-scrollbar shadow-xl border border-white/5 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Clock size={24} className="text-saffron" />
                   </div>
                   <StatusBadge status={selectedTicket.status} dark />
                </div>

                <h3 className="text-xl font-sora font-extrabold leading-tight mb-2">{selectedTicket.title}</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-6">{selectedTicket.description}</p>

                <div className="space-y-6">
                   <DetailRow icon={<User size={14} />} label="Assigned Specialist" value={selectedTicket.assigned_officer?.full_name || "PENDING DISPATCH"} />
                   <DetailRow icon={<Shield size={14} />} label="Jurisdiction" value={selectedTicket.city || "Unknown"} />
                   <DetailRow icon={<Clock size={14} />} label="Filing Date" value={formatDate(selectedTicket.created_at)} />
                </div>

                <div className="mt-10 pt-8 border-t border-white/10">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">{t('IncidentProgress')}</h4>
                   <div className="space-y-4">
                      <AuditStep active label="Issue Identified by AI" time={formatDate(selectedTicket.created_at)} />
                      <AuditStep active={!!selectedTicket.assigned_officer} label="Assigned to Department" time="Automatic" />
                      <AuditStep active={selectedTicket.status === 'resolved'} label="Field Resolution" time="Pending" />
                   </div>
                </div>

                <button 
                  onClick={() => toast.success("Notifying Officer of Priority Shift...")}
                  className="w-full mt-10 py-3 bg-saffron text-navy font-bold rounded-2xl text-sm transition hocus:scale-[1.02] active:scale-95"
                >
                   {t('EscalatePriority')}
                </button>
             </div>
           ) : (
             <div className="flex-1 bg-surface border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-40 italic">
                <div className="w-16 h-16 rounded-full bg-navy/5 flex items-center justify-center mb-4">
                   <Filter className="text-navy" size={24} />
                </div>
                <p className="text-xs font-bold text-navy uppercase tracking-widest">{t('SelectTicketMsg')}</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, dark }) {
  const styles = {
    filed: "bg-surface text-navy border-border",
    in_progress: "bg-navy/10 text-navy border-navy/20",
    resolved: "bg-emerald/10 text-emerald border-emerald/20",
    escalated: "bg-crimson/10 text-crimson border-crimson/20"
  };

  const darkStyles = {
    filed: "bg-white/5 text-white/60 border-white/10",
    in_progress: "bg-saffron/10 text-saffron border-saffron/20",
    resolved: "bg-emerald/10 text-emerald border-emerald/20",
    escalated: "bg-crimson/10 text-crimson border-crimson/20"
  };

  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${dark ? darkStyles[status] : styles[status]}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
       <div className="mt-1 text-white/30">{icon}</div>
       <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">{label}</p>
          <p className="text-sm font-bold text-white mt-1">{value}</p>
       </div>
    </div>
  );
}

function AuditStep({ active, label, time }) {
  return (
    <div className={`flex items-start gap-3 ${active ? 'opacity-100' : 'opacity-20'}`}>
       <div className={`mt-1.5 w-2 h-2 rounded-full ${active ? 'bg-saffron' : 'bg-white/20'}`} />
       <div className="flex-1">
          <p className="text-[11px] font-bold text-white leading-none">{label}</p>
          <p className="text-[9px] text-white/40 mt-1 uppercase font-mono">{time}</p>
       </div>
       {active && <CheckCircle size={12} className="text-emerald" />}
    </div>
  );
}
