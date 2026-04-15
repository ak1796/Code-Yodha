import React from 'react';
import { CheckCircle, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const STEPS = [
  { id: 'filed', label: 'Complaint Filed', icon: Clock },
  { id: 'assigned', label: 'Officer Assigned', icon: User },
  { id: 'in_progress', label: 'Work In Progress', icon: MapPin },
  { id: 'resolved', label: 'Issue Resolved', icon: CheckCircle }
];

export default function StatusTimeline({ currentStatus, timeline = [] }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStatus);

  return (
    <div className="space-y-6">
      {STEPS.map((step, idx) => {
        const isCompleted = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        const StepIcon = step.icon;
        
        // Find audit log entry for this status if it exists in timeline
        const log = timeline.find(l => l.new_value === step.id || (idx === 0 && l.action === 'COMPLAINT_FILED'));

        return (
          <div key={step.id} className="relative flex gap-4">
            {/* Line connector */}
            {idx !== STEPS.length - 1 && (
              <div className={`absolute left-5 top-10 w-0.5 h-12 ${idx < currentIndex ? 'bg-emerald' : 'bg-border'}`} />
            )}
            
            <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
              isCompleted ? 'bg-emerald border-emerald text-white' : 'bg-surface border-border text-text-secondary'
            } ${isCurrent ? 'ring-4 ring-emerald-light' : ''}`}>
              <StepIcon size={20} />
            </div>

            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-sora font-bold ${isCompleted ? 'text-navy' : 'text-text-secondary'}`}>
                  {step.label}
                </h4>
                {isCurrent && <span className="bg-saffron text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Current</span>}
              </div>
              
              {log ? (
                <div className="mt-1">
                   <p className="text-sm text-text-secondary">{log.note || 'Status updated by official'}</p>
                   <p className="text-[11px] text-text-secondary font-medium mt-1">{formatDate(log.created_at)}</p>
                </div>
              ) : isCompleted ? (
                <p className="text-xs text-text-secondary mt-1">Processed</p>
              ) : (
                <p className="text-xs text-text-secondary italic mt-1">Pending...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
