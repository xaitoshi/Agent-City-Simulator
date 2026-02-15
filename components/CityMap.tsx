import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Float, Stars, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Agent, Neighborhood, SocialClass, PoliticalLeaning } from '../types';

interface CityMapProps {
  agents: Agent[];
}

// Configuration for the 4 distinct neighborhoods
const DISTRICTS = [
  { 
    id: Neighborhood.Downtown, 
    position: [0, 0, -2.5] as [number, number, number], 
    color: '#6366f1', // Indigo
    label: 'Downtown',
    buildingCount: 12,
    buildingHeight: [1.5, 4], // Min, Max
    baseSize: [4, 0.2, 3] as [number, number, number]
  },
  { 
    id: Neighborhood.Industrial, 
    position: [-3.5, 0, 1.5] as [number, number, number], 
    color: '#f97316', // Orange
    label: 'Industrial',
    buildingCount: 8,
    buildingHeight: [0.5, 1.5],
    baseSize: [3, 0.2, 3] as [number, number, number]
  },
  { 
    id: Neighborhood.Suburbs, 
    position: [3.5, 0, 1.5] as [number, number, number], 
    color: '#10b981', // Emerald
    label: 'Suburbs',
    buildingCount: 16,
    buildingHeight: [0.3, 0.8],
    baseSize: [3, 0.2, 3] as [number, number, number]
  },
  { 
    id: Neighborhood.Waterfront, 
    position: [0, -0.2, 2.5] as [number, number, number], 
    color: '#06b6d4', // Cyan
    label: 'Waterfront',
    buildingCount: 5,
    buildingHeight: [1, 2.5],
    baseSize: [2.5, 0.2, 2] as [number, number, number]
  },
];

// Helper to determine agent color based on happiness
const getAgentColor = (happiness: number) => {
  if (happiness < 30) return '#ef4444'; // Red-500
  if (happiness < 60) return '#eab308'; // Yellow-500
  return '#22c55e'; // Green-500
};

// Simple pseudo-random hash for stable positioning
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
};

// Component for a single Agent (animated sphere)
const AgentMesh: React.FC<{ agent: Agent; positionOffset: [number, number, number] }> = ({ agent, positionOffset }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = getAgentColor(agent.happiness);
  
  // Random starting phase for animation based on ID
  const phase = useMemo(() => seededRandom(agent.id) * Math.PI * 2, [agent.id]);

  useFrame((state) => {
    if (meshRef.current) {
      // Bobbing animation
      meshRef.current.position.y = positionOffset[1] + 0.3 + Math.sin(state.clock.elapsedTime * 2 + phase) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[positionOffset[0], positionOffset[1], positionOffset[2]]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
  );
};

// Component for a Neighborhood Zone
const Zone: React.FC<{ 
  config: typeof DISTRICTS[0]; 
  agents: Agent[]; 
  onSelect: (id: Neighborhood) => void;
  isSelected: boolean;
}> = ({ 
  config, 
  agents, 
  onSelect, 
  isSelected 
}) => {
  
  // Memoize random buildings so they don't change on re-render
  const buildings = useMemo(() => {
    const b = [];
    // Use config label as seed prefix to ensure buildings are same every time for same district
    for (let i = 0; i < config.buildingCount; i++) {
      const seed = `${config.label}-bldg-${i}`;
      const r1 = seededRandom(seed + 'w');
      const r2 = seededRandom(seed + 'd');
      const r3 = seededRandom(seed + 'h');
      const r4 = seededRandom(seed + 'x');
      const r5 = seededRandom(seed + 'z');

      const w = 0.3 + r1 * 0.4;
      const d = 0.3 + r2 * 0.4;
      const h = config.buildingHeight[0] + r3 * (config.buildingHeight[1] - config.buildingHeight[0]);
      
      const x = (r4 - 0.5) * (config.baseSize[0] - 0.5);
      const z = (r5 - 0.5) * (config.baseSize[2] - 0.5);
      
      b.push({ position: [x, h / 2, z] as [number, number, number], args: [w, h, d] as [number, number, number] });
    }
    return b;
  }, [config]);

  return (
    <group position={config.position}>
      {/* Base Platform */}
      <mesh 
        position={[0, 0, 0]} 
        onClick={(e) => { e.stopPropagation(); onSelect(config.id); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={config.baseSize} />
        <meshStandardMaterial 
          color={config.color} 
          opacity={0.2} 
          transparent 
          roughness={0.1}
          metalness={0.8}
        />
        {/* Selection Highlight */}
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...config.baseSize)]} />
            <lineBasicMaterial color="white" linewidth={2} />
          </lineSegments>
        )}
      </mesh>

      {/* Label */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000"
        >
          {config.label}
        </Text>
      </Float>

      {/* Buildings */}
      {buildings.map((b, i) => (
        <RoundedBox key={i} args={b.args} position={b.position} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={config.color} roughness={0.2} metalness={0.5} />
        </RoundedBox>
      ))}

      {/* Agents - Calculated positions individually to be stable */}
      {agents.map((agent) => {
         const rX = seededRandom(agent.id + 'x');
         const rZ = seededRandom(agent.id + 'z');
         const x = (rX - 0.5) * (config.baseSize[0] - 0.8);
         const z = (rZ - 0.5) * (config.baseSize[2] - 0.8);
         return (
           <AgentMesh key={agent.id} agent={agent} positionOffset={[x, 0.1, z]} />
         );
      })}
    </group>
  );
};

// UI Overlay for selected district
const DistrictInfo = ({ 
  districtId, 
  agents, 
  onClose,
  activeFilters
}: { 
  districtId: Neighborhood, 
  agents: Agent[], 
  onClose: () => void,
  activeFilters: boolean
}) => {
  const districtAgents = agents.filter(a => a.neighborhood === districtId);
  const avgHappiness = Math.round(districtAgents.reduce((sum, a) => sum + a.happiness, 0) / (districtAgents.length || 1));
  const avgWealth = Math.round(districtAgents.reduce((sum, a) => sum + a.wealth, 0) / (districtAgents.length || 1));
  
  const dominantPolitics = useMemo(() => {
    const counts: Record<string, number> = {};
    districtAgents.forEach(a => counts[a.politics] = (counts[a.politics] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }, [districtAgents]);

  return (
    <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
      <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/50 p-4 rounded-xl w-64 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
             <h3 className="text-lg font-bold text-sky-400 leading-none">{districtId}</h3>
             {activeFilters && <span className="text-[10px] text-amber-400 uppercase tracking-wider mt-1">Filters Active</span>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        
        {districtAgents.length === 0 ? (
           <p className="text-sm text-slate-400 py-4 text-center italic">No agents match criteria.</p>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Population (Visible)</span>
                <span className="font-mono">{districtAgents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Happiness</span>
                <span className={`font-mono ${getAgentColor(avgHappiness) === '#ef4444' ? 'text-red-400' : 'text-green-400'}`}>
                  {avgHappiness}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Wealth</span>
                <span className="font-mono">${avgWealth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Politics (Mode)</span>
                <span className="font-mono text-xs bg-slate-800 px-1 py-0.5 rounded">{dominantPolitics}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-500 italic">Latest thought:</p>
              <p className="text-xs text-slate-300">"{districtAgents[0]?.lastThought || 'Sleeping...'}"</p>
            </div>
          </>
        )}
      </div>
    </Html>
  );
};

const CityMap: React.FC<CityMapProps> = ({ agents }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<Neighborhood | null>(null);
  const [filterClass, setFilterClass] = useState<SocialClass | 'All'>('All');
  const [filterPolitics, setFilterPolitics] = useState<PoliticalLeaning | 'All'>('All');

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
       if (filterClass !== 'All' && agent.socialClass !== filterClass) return false;
       if (filterPolitics !== 'All' && agent.politics !== filterPolitics) return false;
       return true;
    });
  }, [agents, filterClass, filterPolitics]);

  const hasActiveFilters = filterClass !== 'All' || filterPolitics !== 'All';

  return (
    <div className="bg-black border border-slate-700 rounded-xl overflow-hidden h-[400px] relative shadow-inner group">
      
      {/* Title */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-black/50 px-2 py-1 rounded backdrop-blur">
          3D City View
        </h3>
      </div>
      
      {/* Filter Controls */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
         <div className="relative">
           <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value as any)}
              className="appearance-none bg-slate-800/80 border border-slate-600 text-xs text-slate-200 pl-2 pr-6 py-1 rounded hover:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer backdrop-blur-sm"
           >
             <option value="All">All Classes</option>
             {Object.values(SocialClass).map(sc => <option key={sc} value={sc}>{sc}</option>)}
           </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400">
             <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
           </div>
         </div>

         <div className="relative">
           <select 
              value={filterPolitics}
              onChange={(e) => setFilterPolitics(e.target.value as any)}
              className="appearance-none bg-slate-800/80 border border-slate-600 text-xs text-slate-200 pl-2 pr-6 py-1 rounded hover:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer backdrop-blur-sm"
           >
             <option value="All">All Politics</option>
             {Object.values(PoliticalLeaning).map(pl => <option key={pl} value={pl}>{pl}</option>)}
           </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400">
             <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
           </div>
         </div>
      </div>
      
      {/* Instructions Overlay */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-right opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         <p className="text-[10px] text-slate-500 uppercase tracking-widest bg-black/50 px-2 py-1 rounded backdrop-blur">
           Left Click: Rotate • Right Click: Pan • Scroll: Zoom • Click Zone: Details
         </p>
      </div>

      <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 25]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4338ca" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <group position={[0, -0.5, 0]}>
          {DISTRICTS.map((district) => (
            <Zone 
              key={district.id} 
              config={district} 
              agents={filteredAgents.filter(a => a.neighborhood === district.id)}
              onSelect={setSelectedDistrict}
              isSelected={selectedDistrict === district.id}
            />
          ))}
        </group>

        {/* Show Info Card centered in view if selected */}
        {selectedDistrict && (
          <DistrictInfo 
            districtId={selectedDistrict} 
            agents={filteredAgents} 
            onClose={() => setSelectedDistrict(null)} 
            activeFilters={hasActiveFilters}
          />
        )}

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minDistance={5} 
          maxDistance={20}
          autoRotate={!selectedDistrict} // Rotate slowly if nothing selected
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default CityMap;