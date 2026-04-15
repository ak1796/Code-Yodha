import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Zap, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import SLATimer from './SLATimer';

export default function OfficerTicketCard({ ticket, isNew }) {
  const navigate = useNavigate();

  const getPriorityBadge = (p) => {
    if (p >= 4) return "bg-crimson text-white shadow-lg shadow-crimson/20 pulse-sm";
    return "bg-gray-100 text-text-secondary border border-border";
  };

  const getCategoryColor = (cat) => {
    const map = {
      'WATER': 'bg-blue-500',
      'ROADS': 'bg-rose-500',
      'ELECTRICITY': 'bg-amber-500',
      'GARBAGE': 'bg-emerald-500'
    };
    return map[cat] || 'bg-navy';
  };

  return (
    <div 
      onClick={() => navigate(`/officer/tickets/${ticket.id}`)}
      className={`group bg-white rounded-[2.5rem] p-8 border border-border shadow-soft transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center hover:scale-[1.01] hover:shadow-2xl ${
        isNew ? 'ring-4 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-slide-in-right' : ''
      }`}
    >
      {isNew && <div className="absolute top-0 right-0 px-6 py-2 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-3xl">NEW AUTO-ASSIGNMENT</div>}
      
      {/* Category Pill */}
      <div className={`w-2 h-20 rounded-full lg:block hidden ${getCategoryColor(ticket.category)}`} />

      <div className="flex-1 space-y-4 w-full">
         <div className="flex justify-between items-start">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-text-secondary opacity-40">UGIRP-{new Date(ticket.created_at).getFullYear()}-{ticket.id.substring(0, 5).toUpperCase()}</span>
                  <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityBadge(ticket.priority_score)}`}>
                    P{ticket.priority_score} {ticket.priority_score >= 4 ? 'CRITICAL' : ''}
                  </span>
               </div>
               <h3 className="text-xl font-sora font-extrabold text-navy tracking-tight line-clamp-1">{ticket.title}</h3>
            </div>
            
            <SLATimer deadline={ticket.sla_deadline} isResolved={ticket.status === 'resolved'} />
         </div>

         <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <MetricItem icon={<MapPin size={14} />} label="Location" val={ticket.address || 'Andheri West, Mumbai'} />
            <MetricItem icon={<Users size={14} />} label="Impact" val={`${ticket.cluster_size || 1} Citizens Affect`} />
            <MetricItem icon={<Zap size={14} />} label="Category" val={ticket.category} badge />
            <MetricItem icon={<MapPin size={14} className="text-emerald" />} label="Distance" val="2.1km from you" />
         </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl group-hover:bg-navy group-hover:text-white transition-colors">
         <ChevronRight size={24} />
      </div>
    </div>
  );
}

function MetricItem({ icon, label, val, badge }) {
   return (
      <div>
         <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary opacity-40 flex items-center gap-2 mb-1">
            {icon} {label}
         </p>
         <p className={`text-[11px] font-extrabold text-navy group-hover:text-current ${badge ? 'px-2 py-0.5 bg-navy/5 rounded-full inline-block' : ''}`}>
            {val}
         </p>
      </div>
   );
}
