import React from 'react';
import { formatDate } from '../../lib/utils';
import { User, Tag, Clock, ArrowRight } from 'lucide-react';

export default function AuditTable({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-secondary">
        <Clock className="mx-auto mb-4 opacity-20" size={48} />
        <p className="font-medium">No audit activities recorded yet.</p>
        <p className="text-xs mt-1">Updates appear here in real-time as officials take action.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-soft">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Event Timestamp</th>
            <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Entity / Ticket</th>
            <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Officer / Actor</th>
            <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Action Performed</th>
            <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">State Change (Old → New)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <span className="text-xs font-mono font-medium text-navy">{formatDate(log.created_at)}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Tag size={12} className="text-navy opacity-40 shrink-0" />
                  <span className="text-xs font-bold text-navy truncate max-w-[120px]" title={log.ticket_id}>
                    #{log.ticket_id?.substring(0, 8)}...
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                   <User size={12} className="text-navy opacity-40 shrink-0" />
                   <span className="text-xs text-text-secondary font-medium">#{log.actor_id?.substring(0, 8) || 'SYSTEM'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-navy uppercase tracking-tighter">
                  {log.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-6 py-4">
                 <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-text-secondary font-medium truncate max-w-[80px]">
                      {typeof log.old_value === 'object' ? JSON.stringify(log.old_value) : log.old_value || 'None'}
                    </span>
                    <ArrowRight size={12} className="text-text-secondary opacity-40" />
                    <span className="px-2 py-0.5 rounded bg-navy text-white font-medium truncate max-w-[80px]">
                      {typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value || 'None'}
                    </span>
                 </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
