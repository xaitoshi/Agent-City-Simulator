import React from 'react';
import { TurnResult } from '../types';

interface AgentFeedProps {
  samples: TurnResult['agentSamples'];
}

const AgentFeed: React.FC<AgentFeedProps> = ({ samples }) => {
  if (!samples || samples.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-sky-400 border-b border-slate-700 pb-2">Citizen Voices</h3>
      <div className="grid gap-4">
        {samples.map((sample, idx) => (
          <div key={idx} className="bg-slate-800/50 border-l-4 border-sky-500 p-3 rounded-r-md">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold text-slate-200">{sample.name}</span>
              <span className="text-xs text-slate-500 font-mono">{sample.agentId}</span>
            </div>
            <p className="text-sm text-slate-300 italic mb-2">"{sample.thought}"</p>
            <div className="flex items-center text-xs text-sky-300 font-medium">
              <span className="bg-sky-900/50 px-2 py-1 rounded">Action: {sample.action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentFeed;