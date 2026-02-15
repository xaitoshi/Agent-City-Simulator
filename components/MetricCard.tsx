import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: number;
  suffix?: string;
  prefix?: string;
  inverse?: boolean; 
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, suffix = '', prefix = '', inverse = false }) => {
  // Determine color and arrow for change
  let changeColor = 'text-gray-500';
  let arrow = '';
  
  if (change !== undefined && change !== 0) {
    const isPositive = change > 0;
    // Normal: Up = Good (Green), Down = Bad (Red)
    // Inverse (e.g. Crime): Up = Bad (Red), Down = Good (Green)
    const isGood = inverse ? !isPositive : isPositive;
    
    changeColor = isGood ? 'text-green-500' : 'text-red-500';
    arrow = isPositive ? '▲' : '▼';
  }

  return (
    <div className="bg-[#c0c0c0] bevel-out p-1 flex flex-col justify-between min-w-[90px] h-full shadow-sm relative">
      <div className="text-[10px] font-bold text-[#404040] uppercase tracking-wider mb-1 truncate">{label}</div>
      <div className="bg-black border-2 border-[#808080] border-t-[#404040] border-l-[#404040] px-1 py-0.5 relative flex-1 flex flex-col justify-center">
         <div className="flex items-baseline justify-between gap-1">
            <span className="font-mono text-lg leading-none text-green-400 shadow-green-900/50 drop-shadow-md">
                {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </span>
            {change !== undefined && change !== 0 && (
                <span className={`font-mono text-[10px] ${changeColor} leading-none ml-auto`}>
                   {arrow}{Math.abs(change).toLocaleString()}
                </span>
            )}
         </div>
         {/* Scanline effect overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-50"></div>
      </div>
    </div>
  );
};

export default MetricCard;