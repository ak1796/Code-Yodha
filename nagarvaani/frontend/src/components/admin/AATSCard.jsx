import React from 'react';
import { TrendingUp, TrendingDown, ShieldCheck } from 'lucide-react';

export default function AATSCard({ department, score, trend, rating, compliance }) {
  const getScoreColor = () => {
    if (score >= 70) return 'text-emerald border-emerald-light bg-emerald-light';
    if (score >= 40) return 'text-amber border-amber-light bg-amber-light';
    return 'text-crimson border-crimson-light bg-crimson-light';
  };

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-soft border border-border flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <h3 className="font-sora font-extrabold text-navy text-lg">{department}</h3>
        <div className={`p-2 rounded-full ${getScoreColor()}`}>
          <ShieldCheck size={20} />
        </div>
      </div>

      <div className="flex items-end gap-3">
        <span className="text-4xl font-sora font-extrabold text-navy tracking-tight">{score}</span>
        <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-full mb-1.5 ${
          trend >= 0 ? 'text-emerald bg-emerald-light' : 'text-crimson bg-crimson-light'
        }`}>
          {trend >= 0 ? <TrendingUp size={14} className="mr-0.5" /> : <TrendingDown size={14} className="mr-0.5" />}
          {Math.abs(trend)}%
        </div>
      </div>

      <div className="space-y-3 mt-2">
        <div className="flex justify-between items-center text-xs text-text-secondary">
          <span className="font-medium uppercase tracking-wider">Citizen Rating</span>
          <span className="text-navy font-bold">{rating}/5.0</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-navy rounded-full" style={{ width: `${(rating / 5) * 100}%` }} />
        </div>
        
        <div className="flex justify-between items-center text-xs text-text-secondary">
          <span className="font-medium uppercase tracking-wider">SLA Compliance</span>
          <span className="text-navy font-bold">{compliance}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-saffron rounded-full" style={{ width: `${compliance}%` }} />
        </div>
      </div>
    </div>
  );
}
