import React from 'react';
import { formatDate } from '../../lib/utils';
import { MapPin, Repeat, UserCheck, AlertTriangle } from 'lucide-react';

export default function CivicMemoryTable({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-secondary">
        <Repeat className="mx-auto mb-4 opacity-10" size={64} />
        <p className="font-medium text-navy text-lg">Civic Memory Initializing...</p>
        <p className="text-sm mt-1">AI is analyzing 2-year history to identify recurring patterns.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-soft">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#1A2D5A] text-white">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Location Zone</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Category</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Occurrence Count (2y)</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Linked Contractors</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Chronicity Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-navy" />
                  <span className="text-sm font-bold text-navy">{item.location_zone}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-text-secondary">{item.category}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Repeat size={14} className="text-saffron" />
                  <span className="text-sm font-extrabold text-navy">{item.occurence_count} instances</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                   {item.contractors?.map((c, i) => (
                     <span key={i} className="text-[10px] font-bold border border-border px-2 py-0.5 rounded-full text-text-secondary whitespace-nowrap">
                       {c}
                     </span>
                   ))}
                </div>
              </td>
              <td className="px-6 py-4">
                 <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.occurence_count > 5 ? 'bg-crimson' : 'bg-amber'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.occurence_count > 5 ? 'text-crimson' : 'text-amber'}`}>
                       {item.occurence_count > 5 ? 'Chronic Problem Zone' : 'Emerging Pattern'}
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
