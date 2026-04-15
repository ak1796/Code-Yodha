import React from 'react';
import { supabase } from "../../lib/supabaseClient";
import { 
  Bell, X, ShieldAlert, Award, AlertTriangle, 
  MessageSquare, Zap, Clock, ChevronRight, Activity, Star
} from 'lucide-react';

const MOCK_NOTIFS = [
  {
    id: 1,
    type: 'ASSIGNMENT',
    title: 'New ticket auto-assigned',
    desc: 'WATER, Borivali West, Priority 3',
    time: '10 mins ago',
    urgent: true,
    unread: true
  },
  {
    id: 2,
    type: 'BREACH',
    title: 'SLA Breach Warning',
    desc: 'Ticket #1187, ROADS, 2 hours overdue',
    time: '1 hour ago',
    urgent: true,
    unread: true
  },
  {
    id: 3,
    type: 'RATING',
    title: 'High Citizen Trust Earned',
    desc: 'Priya Sharma rated your resolution 5 stars',
    time: '3 hours ago',
    urgent: false,
    unread: true
  },
  {
    id: 4,
    type: 'ESCALATION',
    title: 'Escalation Alert',
    desc: 'Ticket #1155 escalated to Dept Head',
    time: 'Yesterday',
    urgent: true,
    unread: false
  }
];

export default function NotificationPanel({ onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
       {/* Backdrop */}
       <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
       
       <div className="relative w-full max-w-md bg-[#F8F9FC] h-screen shadow-2xl animate-slide-in-right flex flex-col border-l border-border">
          
          {/* Header */}
          <div className="p-8 bg-white border-b border-border shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center shadow-lg shadow-navy/20 relative">
                   <Bell size={20} />
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-crimson rounded-full border-2 border-white" />
                </div>
                <div>
                   <h3 className="text-xl font-sora font-extrabold text-navy tracking-tighter uppercase">Tactical Signals</h3>
                   <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-40">Zero-Latency Ingestion Feed</p>
                </div>
             </div>
             <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-xl transition">
                <X size={20} className="text-navy/40" />
             </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             {MOCK_NOTIFS.map((notif) => (
                <div 
                  key={notif.id}
                  className={`group p-6 rounded-[2rem] border bg-white transition-all duration-300 cursor-pointer shadow-soft hover:shadow-xl hover:-translate-y-1 relative overflow-hidden ${
                    notif.unread ? 'border-navy/10' : 'border-transparent opacity-60'
                  }`}
                >
                   {notif.unread && (
                      <div className="absolute top-6 right-6 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                   )}
                   
                   <div className="flex gap-6 items-start">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${getNotifColor(notif.type)}`}>
                         {getNotifIcon(notif.type)}
                      </div>
                      
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-text-secondary">{notif.time}</span>
                            {notif.urgent && <span className="text-[8px] font-black uppercase tracking-widest text-crimson animate-pulse">Critical</span>}
                         </div>
                         <h4 className="text-sm font-extrabold text-navy tracking-tight">{notif.title}</h4>
                         <p className="text-xs text-text-secondary font-medium leading-relaxed italic">{notif.desc}</p>
                      </div>
                   </div>

                   <div className="mt-6 pt-4 border-t border-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black uppercase tracking-widest text-navy bg-navy/5 px-3 py-1 rounded-full">Explore Node</span>
                      <ChevronRight size={14} className="text-navy" />
                   </div>
                </div>
             ))}
          </div>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-border">
             <button className="w-full py-5 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] shadow-xl transition active:scale-95 flex items-center justify-center gap-3">
                <Activity size={16} /> Mark Global Feed as Read
             </button>
          </div>
       </div>
    </div>
  );
}

function getNotifIcon(type) {
  switch (type) {
    case 'ASSIGNMENT': return <Zap size={20} />;
    case 'BREACH': return <AlertTriangle size={20} />;
    case 'RATING': return <Star size={20} />;
    case 'ESCALATION': return <ShieldAlert size={20} />;
    default: return <Bell size={20} />;
  }
}

function getNotifColor(type) {
  switch (type) {
    case 'ASSIGNMENT': return 'bg-blue-500 text-white shadow-lg shadow-blue-500/20';
    case 'BREACH': return 'bg-crimson text-white shadow-lg shadow-crimson/20';
    case 'RATING': return 'bg-saffron text-white shadow-lg shadow-saffron/20';
    case 'ESCALATION': return 'bg-navy text-white shadow-lg shadow-navy/20';
    default: return 'bg-gray-100 text-navy';
  }
}
