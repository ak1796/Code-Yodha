import React from 'react';
import { Sparkles, RefreshCw, ChevronRight, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function InsightsCard({ insights = [], generatedAt, onRefresh, isLoading }) {
  return (
    <div className="bg-surface rounded-2xl card-shadow border border-border overflow-hidden">
      <div className="bg-navy p-5 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-lg">
            <Sparkles size={20} className="text-saffron" />
          </div>
          <div>
            <h3 className="font-sora font-bold text-lg leading-tight">Civic Intelligence</h3>
            <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest mt-0.5">Gemini 1.5 Flash Insight</p>
          </div>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
          title="Refresh Insights"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div key={idx} className="flex gap-4 group">
              <div className="w-8 h-8 rounded-full bg-saffron-light flex items-center justify-center shrink-0 text-saffron font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-navy font-medium leading-relaxed group-hover:text-saffron transition underline-offset-4 decoration-saffron-light">
                  {insight}
                </p>
              </div>
              <div className="flex items-center self-start pt-1 text-border group-hover:text-saffron transition">
                <ChevronRight size={16} />
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-text-secondary">
             <FileText className="mx-auto mb-3 opacity-20" size={48} />
             <p className="text-sm">Generating actionable recommendations...</p>
          </div>
        )}
      </div>

      {generatedAt && (
        <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-between items-center">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Analysis complete</span>
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{formatDate(generatedAt)}</span>
        </div>
      )}
    </div>
  );
}
