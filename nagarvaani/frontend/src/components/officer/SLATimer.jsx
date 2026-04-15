import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function SLATimer({ deadline, isResolved }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('NORMAL');

  useEffect(() => {
    if (isResolved) {
      setStatus('RESOLVED');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(deadline);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setStatus('BREACHED');
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );

      // Status Logic
      if (diff < 10 * 60 * 1000) setStatus('PULSING');
      else if (diff < 30 * 60 * 1000) setStatus('CRITICAL');
      else if (diff < 60 * 60 * 1000) setStatus('WARNING');
      else setStatus('NORMAL');

    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, isResolved]);

  if (status === 'RESOLVED') return (
    <div className="flex items-center gap-2 px-6 py-2 bg-emerald-light/20 text-emerald rounded-2xl border border-emerald/20">
       <div className="w-1.5 h-1.5 bg-emerald rounded-full" />
       <span className="text-[10px] font-black uppercase tracking-widest leading-none">FULFILLED</span>
    </div>
  );

  if (status === 'BREACHED') return (
    <div className="px-6 py-2 bg-crimson text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-crimson/20">
       <AlertTriangle size={14} />
       <span className="text-[10px] font-black uppercase tracking-widest leading-none">BREACHED</span>
    </div>
  );

  const colors = {
    NORMAL: 'bg-gray-100 text-navy border-border',
    WARNING: 'bg-saffron-light/20 text-saffron border-saffron/20',
    CRITICAL: 'bg-crimson-light/20 text-crimson border-crimson/20 shadow-lg shadow-crimson/5',
    PULSING: 'bg-crimson text-white animate-pulse shadow-xl shadow-crimson/20'
  };

  return (
    <div className={`px-6 py-3 rounded-2xl border flex flex-col items-center transition-all duration-500 min-w-[120px] ${colors[status]}`}>
       <div className="flex items-center gap-2 opacity-60">
          <Clock size={12} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">SLA Remainder</span>
       </div>
       <span className="text-xl font-sora font-extrabold tracking-tighter leading-tight mt-1 tabular-nums">
          {timeLeft || '--:--:--'}
       </span>
    </div>
  );
}
