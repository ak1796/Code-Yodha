import React from 'react';
import { formatDate } from '../../lib/utils';
import { MapPin, Repeat, UserCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CivicMemoryTable({ data = [] }) {
  const { t } = useTranslation();
  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-[#162F6A]/30 p-12 text-center text-text-secondary">
        <Repeat className="mx-auto mb-4 opacity-10" size={64} />
        <p className="font-medium text-navy text-lg">{t('CM_Initializing')}</p>
        <p className="text-sm mt-1">{t('CM_AIAnalyzing')}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-[#162F6A]/30 overflow-hidden shadow-soft">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#1A2D5A] text-white">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('CM_LocationZone')}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('CM_Category')}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('CM_OccurrenceCount')}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('CM_LinkedContractors')}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('CM_ChronicityRisk')}</th>
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
                  <span className="text-sm font-extrabold text-navy">{item.occurence_count} {t('CM_Instances')}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                   {item.contractors?.map((c, i) => (
                     <span key={i} className="text-[10px] font-bold border border-[#162F6A]/20 px-2 py-0.5 rounded-full text-text-secondary whitespace-nowrap">
                       {c}
                     </span>
                   ))}
                </div>
              </td>
              <td className="px-6 py-4">
                 <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.occurence_count > 5 ? 'bg-crimson' : 'bg-amber'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.occurence_count > 5 ? 'text-crimson' : 'text-amber'}`}>
                       {item.occurence_count > 5 ? t('CM_ChronicProblemZone') : t('CM_EmergingPattern')}
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
