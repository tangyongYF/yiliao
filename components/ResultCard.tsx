import React, { useState } from 'react';
import { Indicator } from '../types';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ResultCardProps {
  indicator: Indicator;
}

export const ResultCard: React.FC<ResultCardProps> = ({ indicator }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getIcon = (status: string) => {
    switch(status) {
      case 'critical': return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-orange-600" />;
      default: return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
  };

  return (
    <div className={`mb-4 rounded-xl border-2 p-4 transition-all ${getStatusColor(indicator.status)}`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {getIcon(indicator.status)}
          <div>
            <h3 className="text-xl font-bold">{indicator.name}</h3>
            <p className="text-lg font-mono font-medium opacity-80">{indicator.value}</p>
          </div>
        </div>
        <button className="p-2 rounded-full bg-white/50">
          {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-black/10">
          <div className="bg-white/60 p-3 rounded-lg mb-3">
            <span className="text-sm font-bold uppercase opacity-60">生活化比喻</span>
            <p className="text-lg font-medium mt-1">{indicator.metaphor}</p>
          </div>
          <div className="bg-white/60 p-3 rounded-lg">
             <span className="text-sm font-bold uppercase opacity-60">医生说</span>
            <p className="text-lg mt-1">{indicator.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};