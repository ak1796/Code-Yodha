import React from 'react';
import { MapPin, Users, Calendar, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const STATUS_CONFIG = {
  filed: { label: 'Filed', color: 'bg-saffron-light text-saffron' },
  assigned: { label: 'Assigned', color: 'bg-amber-light text-amber' },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600' },
  resolved: { label: 'Resolved', color: 'bg-emerald-light text-emerald' },
  rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-500' }
};

const CATEGORY_ICONS = {
  WATER: '💧',
  ELECTRICITY: '⚡',
  ROADS: '🛣️',
  GARBAGE: '🗑️',
  PARKS: '🌳',
  PUBLIC_SAFETY: '🛡️',
  OTHER: '📋'
};

export default function ComplaintCard({ ticket, onClick }) {
  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.filed;

  return (
    <div 
      onClick={() => onClick && onClick(ticket.id)}
      className="bg-surface rounded-xl card-shadow overflow-hidden cursor-pointer hover:border-navy transition border border-transparent"
    >
      <div className="flex p-5 gap-4">
        <div className="text-3xl bg-gray-50 h-16 w-16 min-w-[64px] flex items-center justify-center rounded-lg">
          {CATEGORY_ICONS[ticket.category] || '📋'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${status.color}`}>
              {status.label}
            </span>
            <div className="flex items-center gap-1 text-sm font-bold text-navy">
              <span className="text-xs uppercase text-text-secondary font-medium mr-1">Priority</span>
              {ticket.priority_score || '3'}
            </div>
          </div>
          
          <h3 className="font-sora font-semibold text-navy truncate leading-snug">
            {ticket.title || 'Untitled Complaint'}
          </h3>
          
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-navy" />
              <span className="truncate max-w-[120px]">{ticket.extracted_location || 'Unknown'}</span>
            </div>
            {ticket.cluster_size > 1 && (
              <div className="flex items-center gap-1 text-saffron font-medium">
                <Users size={12} />
                <span>+{ticket.cluster_size - 1} cases</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(ticket.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {ticket.status !== 'resolved' && ticket.sla_deadline && (
        <div className="px-5 py-2 bg-gray-50 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-1 text-[10px] text-text-secondary uppercase tracking-tight">
             <Clock size={10} /> Resolving by {formatDate(ticket.sla_deadline)}
           </div>
        </div>
      )}
    </div>
  );
}
