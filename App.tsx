import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_METRICS, generateAgents } from './constants';
import { Agent, CityMetrics, TurnResult, SimulationState } from './types';
import { simulateTurn } from './services/geminiService';
import MetricCard from './components/MetricCard';
import CityMap from './components/CityMap';
import AgentFeed from './components/AgentFeed';

// Icons
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);

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
  
  // Track previous metrics to calculate changes
  const [prevMetrics, setPrevMetrics] = useState<CityMetrics>(INITIAL_METRICS);
  const [lastTurnData, setLastTurnData] = useState<TurnResult | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize agents on mount
  useEffect(() => {
    const agents = generateAgents(100);
    setState(s => ({ ...s, agents }));
  }, []);

  // Auto-scroll narrative
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

    // Call Gemini
    const result = await simulateTurn(state.metrics, userAction, state.metrics.turn);

    // Update individual agents based on global modifiers
    const updatedAgents = state.agents.map(agent => {
      let hDelta = result.globalModifiers.happinessDelta;
      let wDelta = result.globalModifiers.wealthDelta;

      // Add noise/variance to updates so not everyone reacts identically
      const noise = (Math.random() - 0.5) * 5; 
      
      let newHappiness = agent.happiness + hDelta + noise;
      // Clamp happiness
      newHappiness = Math.max(0, Math.min(100, newHappiness));
      
      let newWealth = agent.wealth + wDelta;

      return {
        ...agent,
        happiness: newHappiness,
        wealth: newWealth,
      };
    });

    // Determine Game Over
    let isGameOver = false;
    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';

    if (result.metrics.govApproval < 30) {
      isGameOver = true;
      gameStatus = 'lost';
    } else if (result.metrics.turn > 10) {
      if (result.metrics.govApproval > 70) {
        isGameOver = true;
        gameStatus = 'won';
      } else {
        isGameOver = true;
        gameStatus = 'lost';
      }
    }

    setPrevMetrics(state.metrics);
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

  const calculateChange = (key: keyof CityMetrics) => {
    if (!prevMetrics) return 0;
    return Number((state.metrics[key] - prevMetrics[key]).toFixed(1));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar / Stats Panel (Mobile: Top, Desktop: Left) */}
      <aside className="w-full md:w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-auto md:h-screen overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            Neo Haven
          </h1>
          <p className="text-slate-500 text-sm mt-1">Mayor's Office | Turn {state.metrics.turn}/10</p>
        </div>

        <div className="p-4 grid gap-4">
          <MetricCard 
            label="Approval" 
            value={state.metrics.govApproval} 
            suffix="%" 
            change={calculateChange('govApproval')} 
          />
           <MetricCard 
            label="Happiness" 
            value={Math.round(state.metrics.avgHappiness)} 
            suffix="%" 
            change={calculateChange('avgHappiness')} 
          />
          <MetricCard 
            label="Budget (GDP)" 
            value={state.metrics.gdp} 
            prefix="$" 
            suffix="M"
            change={calculateChange('gdp')} 
          />
          <MetricCard 
            label="Population" 
            value={state.metrics.population} 
            change={calculateChange('population')} 
          />
          <MetricCard 
            label="Unemployment" 
            value={state.metrics.unemployment} 
            suffix="%" 
            change={calculateChange('unemployment')} 
            inverse 
          />
          <MetricCard 
            label="Crime Rate" 
            value={state.metrics.crimeRate} 
            suffix="%" 
            change={calculateChange('crimeRate')} 
            inverse 
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.80))] md:h-screen relative">
        
        {/* Scrollable Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32" ref={scrollRef}>
          
          {state.history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <div className="w-16 h-16 bg-sky-900/30 rounded-full flex items-center justify-center text-sky-400 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.5a2.5 2.5 0 0 0-5 0V21"/></svg>
              </div>
              <p className="text-xl font-light">Welcome, Mayor. The city awaits your first command.</p>
              <p className="text-sm text-slate-500 max-w-md">
                Try: "Raise taxes on the wealthy", "Build a new park downtown", or "Declare a climate emergency".
              </p>
            </div>
          )}

          {/* History Log */}
          {state.history.map((h, idx) => (
            <div key={idx} className="max-w-4xl mx-auto animate-fadeIn">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-mono">TURN {h.turn}</span>
                <span className="font-bold text-lg text-white">"{h.action}"</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl shadow-lg backdrop-blur-sm">
                <p className="text-slate-300 leading-relaxed text-lg font-light">{h.narrative}</p>
              </div>
            </div>
          ))}
          
          {/* Latest Turn Visualization */}
          {lastTurnData && !loading && (
             <div className="max-w-4xl mx-auto mt-8 grid md:grid-cols-2 gap-8">
               <CityMap agents={state.agents} />
               <AgentFeed samples={lastTurnData.agentSamples} />
             </div>
          )}

           {/* Loading State */}
          {loading && (
             <div className="max-w-4xl mx-auto mt-8">
               <div className="flex items-center gap-3 text-sky-400 animate-pulse">
                 <div className="w-4 h-4 rounded-full bg-sky-400"></div>
                 <span className="font-mono text-sm">Simulating consequences...</span>
               </div>
             </div>
          )}
          
          {/* Game Over Screen */}
          {state.isGameOver && (
            <div className={`p-8 rounded-xl border-2 text-center mt-12 mb-20 ${state.gameStatus === 'won' ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
              <h2 className="text-3xl font-bold mb-4">{state.gameStatus === 'won' ? 'You Win! A Thriving Metropolis.' : 'Game Over. The City Has Fallen.'}</h2>
              <p className="text-lg opacity-80 mb-6">
                {state.gameStatus === 'won' 
                  ? "Your approval rating is high and the city prospers. History will remember you fondly." 
                  : "Public unrest has reached a breaking point. You have been removed from office."}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-white text-slate-900 font-bold rounded hover:bg-slate-200 transition"
              >
                Start New Term
              </button>
            </div>
          )}

        </div>

        {/* Input Area (Sticky Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <form onSubmit={handleAction} className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={state.isGameOver ? "Simulation ended." : "Enter your policy or event..."}
              disabled={loading || state.isGameOver}
              className="w-full bg-slate-900/90 border border-slate-700 text-white pl-6 pr-14 py-4 rounded-full shadow-2xl focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || state.isGameOver}
              className="absolute right-2 top-2 p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full disabled:bg-slate-700 transition-colors"
            >
              <SendIcon />
            </button>
          </form>
        </div>

      </main>
    </div>
  );
};

export default App;