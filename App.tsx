import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_METRICS, generateAgents } from './constants';
import { CityMetrics, TurnResult, SimulationState } from './types';
import { simulateTurn } from './services/geminiService';
import CityMap from './components/CityMap';
import AgentFeed from './components/AgentFeed';
import MetricCard from './components/MetricCard';

// Retro Icons (Using SVG paths)
const Icon = ({ path }: { path: string }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d={path} />
  </svg>
);

const ICONS = {
  Bulldozer: "M19 13H5V11H19V13ZM19 5H5V7H19V5ZM5 17H19V19H5V17Z", // Simple lines
  Residential: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  Commercial: "M4 20h16V4H4v16zm2-14h12v2H6V6zm0 4h12v2H6v-2zm0 4h12v2H6v-2z",
  Industrial: "M2 22h20V2z",
  Road: "M18 2h-4v20h4V2zM10 2H6v20h4V2z",
  Police: "M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
  Fire: "M17.56 10.24c-.28 2.08-1.42 4.4-3.15 5.25.04.42.09.83.09 1.26 0 2.21-1.79 4-4 4s-4-1.79-4-4c0-1.87 2.11-4.83 5.46-7.55-.42 1.35.34 3.01 1.76 3.01.52 0 1.01-.23 1.33-.59.78-.86.91-2.1.34-3.52 1.94 1.15 2.65 3.33 2.17 5.14z",
  Money: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  Disaster: "M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [state, setState] = useState<SimulationState>({
    metrics: INITIAL_METRICS,
    agents: [],
    history: [],
    isGameOver: false,
    gameStatus: 'playing'
  });
  
  // Track changes from previous turn
  const [diffs, setDiffs] = useState<Partial<CityMetrics>>({});
  
  const [lastTurnData, setLastTurnData] = useState<TurnResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize agents
  useEffect(() => {
    const agents = generateAgents(100);
    setState(s => ({ ...s, agents }));
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.history]);

  const handleAction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || state.isGameOver) return;

    setLoading(true);
    const userAction = input;
    setInput('');

    // Capture previous metrics for diff calculation
    const prevMetrics = state.metrics;

    const result = await simulateTurn(state.metrics, userAction, state.metrics.turn);

    const updatedAgents = state.agents.map(agent => {
      let hDelta = result.globalModifiers.happinessDelta;
      let wDelta = result.globalModifiers.wealthDelta;
      const noise = (Math.random() - 0.5) * 5; 
      let newHappiness = Math.max(0, Math.min(100, agent.happiness + hDelta + noise));
      let newWealth = agent.wealth + wDelta;
      return { ...agent, happiness: newHappiness, wealth: newWealth };
    });

    let isGameOver = false;
    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';

    if (result.metrics.govApproval < 30) {
      isGameOver = true;
      gameStatus = 'lost';
    } else if (result.metrics.turn > 10) {
      isGameOver = result.metrics.govApproval > 70 ? true : true;
      gameStatus = result.metrics.govApproval > 70 ? 'won' : 'lost';
    }

    // Calculate diffs
    setDiffs({
      avgHappiness: result.metrics.avgHappiness - prevMetrics.avgHappiness,
      unemployment: result.metrics.unemployment - prevMetrics.unemployment,
      gdp: result.metrics.gdp - prevMetrics.gdp,
      crimeRate: result.metrics.crimeRate - prevMetrics.crimeRate,
      population: result.metrics.population - prevMetrics.population,
      govApproval: result.metrics.govApproval - prevMetrics.govApproval,
    });

    setLastTurnData(result);
    setState(prev => ({
      metrics: result.metrics,
      agents: updatedAgents,
      history: [...prev.history, {
        turn: prev.metrics.turn,
        action: userAction,
        narrative: result.narrative
      }],
      isGameOver,
      gameStatus
    }));

    setLoading(false);
  };

  const QuickAction = (action: string) => {
    if (loading) return;
    setInput(action);
  };

  const getMonthYear = (turn: number) => {
    const startYear = 2000;
    const year = startYear + Math.floor((turn - 1) / 12);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[(turn - 1) % 12];
    return `${month} ${year}`;
  };

  return (
    <div className="h-screen flex flex-col bg-[#c0c0c0] font-pixel text-lg select-none">
      
      {/* 1. Menu Bar */}
      <div className="h-8 bg-[#c0c0c0] border-b-2 border-white border-r-2 flex items-center px-2 space-x-4 shadow-[inset_-1px_-1px_0px_#404040]">
        {['File', 'Speed', 'Options', 'Disasters', 'Windows', 'Newspaper'].map(item => (
          <button key={item} className="px-2 py-0.5 hover:bg-[#000080] hover:text-white active:bg-[#000080] active:text-white focus:outline-none">
            {item}
          </button>
        ))}
      </div>

      {/* 2. Info Strip */}
      <div className="h-8 bg-white border-2 border-[#404040] mx-1 mt-1 flex items-center justify-between px-4 font-bold tracking-widest">
        <div className="flex space-x-8">
           <span className="text-black">{getMonthYear(state.metrics.turn)}</span>
           <span className="text-[#000080]">&lt;Neo Haven&gt;</span>
        </div>
        <div className="flex space-x-8 text-sm">
           <span>MAYOR: YOU</span>
           <span>FUNDS: $20,000</span>
        </div>
      </div>

      {/* 3. Main Container */}
      <div className="flex-1 flex p-1 gap-1 overflow-hidden">
        
        {/* Left Toolbar */}
        <div className="w-16 flex flex-col gap-1 py-1">
          {[
            { id: 'Residential', icon: ICONS.Residential, action: 'Zone more residential areas' },
            { id: 'Commercial', icon: ICONS.Commercial, action: 'Incentivize commercial growth' },
            { id: 'Industrial', icon: ICONS.Industrial, action: 'Expand industrial zones' },
            { id: 'Road', icon: ICONS.Road, action: 'Repair infrastructure' },
            { id: 'Police', icon: ICONS.Police, action: 'Increase police funding' },
            { id: 'Fire', icon: ICONS.Fire, action: 'Upgrade fire stations' },
            { id: 'Tax', icon: ICONS.Money, action: 'Raise taxes on the wealthy' },
            { id: 'Disaster', icon: ICONS.Disaster, action: 'Trigger a minor earthquake' },
          ].map(tool => (
            <button 
              key={tool.id}
              onClick={() => QuickAction(tool.action)}
              title={tool.action}
              className="w-full aspect-square bg-[#c0c0c0] bevel-out hover:bg-[#dfdfdf] active:bevel-in flex items-center justify-center text-[#404040]"
            >
              <Icon path={tool.icon} />
            </button>
          ))}
          <div className="flex-1"></div>
          {/* Bulldozer/Reset placeholder */}
          <button onClick={() => window.location.reload()} className="w-full aspect-square bg-[#c0c0c0] bevel-out active:bevel-in flex items-center justify-center text-red-700 font-bold" title="Reset City">
            RST
          </button>
        </div>

        {/* Center Viewport */}
        <div className="flex-1 flex flex-col gap-1 relative">
          
          {/* The 3D Map Frame */}
          <div className="flex-1 border-4 border-[#404040] border-r-white border-b-white shadow-[inset_2px_2px_0px_#000] bg-black relative">
             <div className="absolute inset-0">
               <CityMap agents={state.agents} />
             </div>
             {/* Overlay for Game Over */}
             {state.isGameOver && (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
                 <div className="bg-[#c0c0c0] border-2 border-white border-b-[#404040] border-r-[#404040] p-1 shadow-xl">
                    <div className="bg-[#000080] text-white px-2 py-1 font-bold mb-2 flex justify-between">
                      <span>{state.gameStatus === 'won' ? 'VICTORY' : 'DEFEAT'}</span>
                      <button onClick={() => window.location.reload()}>X</button>
                    </div>
                    <div className="p-4 text-center">
                       <p className="mb-4 text-xl">
                         {state.gameStatus === 'won' ? 'The city is thriving!' : 'You have been impeached.'}
                       </p>
                       <button onClick={() => window.location.reload()} className="bevel-out px-4 py-2 bg-[#c0c0c0] active:bevel-in">
                         New City
                       </button>
                    </div>
                 </div>
               </div>
             )}
          </div>
          
          {/* Stats Dashboard */}
          <div className="bg-[#c0c0c0] bevel-out p-1 grid grid-cols-6 gap-1 shrink-0 h-16 overflow-hidden">
              <MetricCard label="Happiness" value={Math.round(state.metrics.avgHappiness)} suffix="%" change={diffs.avgHappiness} />
              <MetricCard label="Unemployment" value={state.metrics.unemployment} suffix="%" inverse change={diffs.unemployment} />
              <MetricCard label="GDP" value={state.metrics.gdp} prefix="$" suffix="M" change={diffs.gdp} />
              <MetricCard label="Crime Rate" value={state.metrics.crimeRate} suffix="%" inverse change={diffs.crimeRate} />
              <MetricCard label="Population" value={state.metrics.population} change={diffs.population} />
              <MetricCard label="Approval" value={state.metrics.govApproval} suffix="%" change={diffs.govApproval} />
          </div>

          {/* Bottom Panel: Windows/Log */}
          <div className="h-64 flex gap-1">
             
             {/* Narrative Window */}
             <div className="flex-1 flex flex-col bg-[#c0c0c0] bevel-out p-1">
                <div className="bg-[#000080] h-6 flex justify-between items-center px-2 mb-1">
                   <span className="text-white font-bold tracking-wide">City Log</span>
                   <div className="w-4 h-4 bg-[#c0c0c0] bevel-out flex items-center justify-center text-[10px]">▼</div>
                </div>
                <div className="flex-1 bg-white border-2 border-[#404040] border-r-white border-b-white overflow-y-auto p-2 font-mono text-base" ref={scrollRef}>
                   {state.history.length === 0 ? (
                     <div className="text-gray-500">
                       &gt; SYSTEM READY.<br/>
                       &gt; WAITING FOR MAYOR INPUT...
                     </div>
                   ) : (
                     state.history.map((h, i) => (
                       <div key={i} className="mb-2 border-b border-dashed border-gray-400 pb-1">
                         <span className="font-bold">Turn {h.turn}:</span> {h.narrative}
                       </div>
                     ))
                   )}
                   {loading && <div className="animate-pulse">&gt; Simulating...</div>}
                </div>
                
                {/* Input Bar inside the window */}
                <form onSubmit={handleAction} className="mt-1 flex gap-1">
                  <span className="font-bold self-center px-1">&gt;</span>
                  <input 
                    className="flex-1 bg-white border-2 border-[#808080] px-1 focus:outline-none font-mono"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Enter command..."
                    autoFocus
                    disabled={state.isGameOver}
                  />
                  <button type="submit" className="px-4 bg-[#c0c0c0] bevel-out active:bevel-in font-bold">
                    SEND
                  </button>
                </form>
             </div>

             {/* Agent Reactions Window */}
             <div className="w-1/3 flex flex-col bg-[#c0c0c0] bevel-out p-1 hidden md:flex">
                <div className="bg-[#000080] h-6 flex justify-between items-center px-2 mb-1">
                   <span className="text-white font-bold tracking-wide">Newspaper</span>
                   <div className="w-4 h-4 bg-[#c0c0c0] bevel-out flex items-center justify-center text-[10px]">■</div>
                </div>
                <div className="flex-1 bg-white border-2 border-[#404040] border-r-white border-b-white overflow-y-auto p-2 relative">
                  {lastTurnData ? (
                    <AgentFeed samples={lastTurnData.agentSamples} />
                  ) : (
                    <div className="flex items-center justify-center h-full opacity-50 text-center">
                      <p>No News Is Good News</p>
                    </div>
                  )}
                </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default App;