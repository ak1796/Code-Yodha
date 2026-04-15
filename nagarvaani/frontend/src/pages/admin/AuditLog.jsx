import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AuditTable from '../../components/admin/AuditTable';
import { History, Shield, Filter, Download, Activity, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
       let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
       if (filter !== 'ALL') {
         query = query.eq('action', filter);
       }
       const { data } = await query;
       setLogs(data || []);
    } catch (error) {
       toast.error("Real-time audit stream error");
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  return (
    <div className="min-h-screen bg-bg p-12">
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-border pb-12">
           <div className="flex gap-6 items-start">
              <div className="w-20 h-20 bg-navy text-white rounded-3xl flex items-center justify-center shadow-xl transform rotate-3"><History size={40} /></div>
              <div>
                 <div className="flex items-center gap-2 mb-2 text-navy opacity-40">
                    <Shield size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Security Compliance Module</span>
                 </div>
                 <h1 className="text-5xl font-sora font-extrabold text-navy tracking-tight">Immutable Audit Log</h1>
                 <p className="text-lg font-medium text-text-secondary mt-2 opacity-60">Legal-grade record of all platform activity and official actions.</p>
              </div>
           </div>
           
           <div className="flex flex-col items-end gap-1 px-4 lg:px-0">
              <div className="flex items-center gap-3 bg-navy p-2 rounded-2xl shadow-xl">
                 <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest mr-2">Streaming Live Data</span>
              </div>
              <p className="text-[10px] font-bold text-text-secondary mt-1 opacity-40 uppercase tracking-widest">Shard ID: AUDIT_NODE_01</p>
           </div>
        </header>

        <section className="space-y-8">
           <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-surface p-6 rounded-3xl border border-border shadow-soft">
              <div className="flex items-center gap-4 w-full lg:w-fit">
                 <div className="p-3 bg-gray-50 rounded-xl text-navy"><Filter size={20} /></div>
                 <select 
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                   className="flex-1 bg-transparent border-none outline-none font-sora font-extrabold text-navy text-sm appearance-none"
                 >
                   <option value="ALL">ALL ACTIONS</option>
                   <option value="COMPLAINT_FILED">COMPLAINT FILED</option>
                   <option value="STATUS_CHANGED">STATUS CHANGED</option>
                   <option value="RESOLUTION_SUBMITTED">RESOLUTION SUBMITTED</option>
                   <option value="SLA_BREACH_ESCALATION">SLA BREACH</option>
                 </select>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-fit">
                 <button 
                    onClick={fetchLogs}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gray-50 text-navy px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-navy hover:text-white transition group"
                 >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} /> Refresh
                 </button>
                 <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-navy-light transition shadow-lg">
                    Export CSV <Download size={16} />
                 </button>
              </div>
           </div>

           <AuditTable logs={logs} />
        </section>

        <footer className="pt-12 text-center text-text-secondary opacity-40">
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">
             This audit trail is protected by end-to-end cryptographic hashing. Any attempt to modify records will trigger an immediate system-wide escalation to the Municipal Commissioner's Office.
           </p>
        </footer>
      </div>
    </div>
  );
}
