import React, { useState } from 'react';
import { TurnResult } from '../types';

interface AgentFeedProps {
  samples: TurnResult['agentSamples'];
}

const AgentFeed: React.FC<AgentFeedProps> = ({ samples }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!samples || samples.length === 0) return null;

  // Detail View
  if (selectedIdx !== null && samples[selectedIdx]) {
    const sample = samples[selectedIdx];
    return (
      <div className="h-full flex flex-col font-serif p-1 animate-in fade-in duration-300">
        <button 
          onClick={() => setSelectedIdx(null)}
          className="mb-2 text-xs font-bold uppercase hover:bg-black hover:text-white border border-black px-1 self-start flex items-center gap-1"
        >
          <span>←</span> Back to Headlines
        </button>
        <div className="overflow-y-auto pr-1 flex-1">
          <h2 className="text-xl font-bold leading-none mb-1">{sample.name}</h2>
          <p className="text-xs italic mb-2 text-gray-600 border-b border-gray-300 pb-1">{sample.agentId}</p>
          
          <div className="text-sm leading-snug mb-3 font-bold text-gray-800">
            "{sample.thought}"
          </div>

          {/* Cognitive Process Display */}
          {sample.reasoning && sample.reasoning.length > 0 && (
            <div className="mb-4 bg-gray-50 p-2 border border-gray-300 border-l-4 border-l-black">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                 Cognitive Chain
               </h3>
               <ul className="space-y-2">
                 {sample.reasoning.map((step, i) => (
                   <li key={i} className="text-xs text-gray-800 flex gap-2">
                     <span className="font-mono font-bold text-gray-400 select-none">
                       {i === 0 ? 'PERCEIVE' : i === 1 ? 'RECALL' : i === 2 ? 'EVAL' : 'ACT'} &gt;
                     </span>
                     <span>{step}</span>
                   </li>
                 ))}
               </ul>
            </div>
          )}
          
          <div className="text-sm leading-relaxed text-justify mb-4 italic text-gray-700">
             {sample.fullStory || "Full details not available for this report."}
          </div>

          <div className="bg-gray-100 p-2 border border-gray-300 text-xs shadow-sm">
            <span className="font-bold uppercase tracking-wider">Action Taken:</span> {sample.action}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4 font-serif">
      <div className="text-center border-b-2 border-black pb-1 mb-2">
        <h2 className="text-2xl font-bold uppercase leading-none">The Daily Byte</h2>
        <span className="text-xs">VOL. 1 | PRICE: 50¢ | TAP TO READ</span>
      </div>
      
      {samples.map((sample, idx) => (
        <div 
          key={idx} 
          className="mb-4 text-sm leading-tight cursor-pointer hover:bg-black/5 p-1 -m-1 transition-colors group"
          onClick={() => setSelectedIdx(idx)}
        >
          <h4 className="font-bold text-base mb-0.5 group-hover:underline decoration-1 underline-offset-2">
            "{sample.thought.length > 50 ? sample.thought.substring(0, 45) + '...' : sample.thought}"
          </h4>
          <p className="text-xs mb-1 italic flex justify-between">
            <span>— {sample.name}</span>
            <span className="text-gray-400 font-bold group-hover:text-black">READ →</span>
          </p>
          {idx < samples.length - 1 && <hr className="border-t border-black mt-2 border-dashed" />}
        </div>
      ))}
    </div>
  );
};

export default AgentFeed;