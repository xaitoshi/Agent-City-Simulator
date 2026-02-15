import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: number;
  suffix?: string;
  prefix?: string;
  inverse?: boolean; // If true, positive change is bad (e.g., crime)
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, suffix = '', prefix = '', inverse = false }) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const isNeutral = !change || change === 0;

  // Determine color for change indicator
  let changeColor = 'text-gray-400';
  if (isPositive) changeColor = inverse ? 'text-red-400' : 'text-green-400';
  if (isNegative) changeColor = inverse ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-sm flex flex-col justify-between">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</h3>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-mono font-bold text-white">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
        {!isNeutral && (
          <span className={`text-sm font-medium ${changeColor} flex items-center`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change!)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;