import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, RoundedBox, Cylinder, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Agent, Neighborhood, SocialClass, PoliticalLeaning } from '../types';

interface CityMapProps {
  agents: Agent[];
}

// --- Configuration ---

const DISTRICTS = [
  { 
    id: Neighborhood.Downtown, 
    position: [-5, 0, 5] as [number, number, number], 
    color: '#818cf8', // Indigo/Blue buildings
    label: 'Downtown',
    buildingCount: 16,
    buildingHeight: [2, 5], 
    areaSize: 5
  },
  { 
    id: Neighborhood.Industrial, 
    position: [-5, 0, -5] as [number, number, number], 
    color: '#fb923c', // Orange/Rust
    label: 'Industrial',
    buildingCount: 10,
    buildingHeight: [1, 2.5],
    areaSize: 5
  },
  { 
    id: Neighborhood.Suburbs, 
    position: [5, 0, -5] as [number, number, number], 
    color: '#34d399', // Greenish/Teal
    label: 'Suburbs',
    buildingCount: 24,
    buildingHeight: [0.5, 1],
    areaSize: 5
  },
  { 
    id: Neighborhood.Waterfront, 
    position: [5, 0, 5] as [number, number, number], 
    color: '#22d3ee', // Cyan
    label: 'Waterfront',
    buildingCount: 8,
    buildingHeight: [1.5, 3],
    areaSize: 5
  },
];

const getAgentColor = (happiness: number) => {
  if (happiness < 30) return '#ef4444'; // Red
  if (happiness < 60) return '#eab308'; // Yellow
  return '#22c55e'; // Green
};

// --- Sub-Components ---

// 1. Walking Agent (Low Poly Person)
const WalkingAgent: React.FC<{ agent: Agent, origin: [number, number, number], color: string }> = ({ agent, origin, color }) => {
  const group = useRef<THREE.Group>(null);
  // Initial target is just the origin, will update immediately
  const target = useRef(new THREE.Vector3(origin[0], 0, origin[2]));
  const speed = useRef(0.5 + Math.random() * 0.8); // Random walking speed
  
  // Pick a random spot within a 2.5 unit radius of their home zone center
  const pickNewTarget = () => {
    const radius = 2.5; 
    const x = origin[0] + (Math.random() - 0.5) * radius * 2;
    const z = origin[2] + (Math.random() - 0.5) * radius * 2;
    target.current.set(x, 0, z);
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    
    const currentPos = group.current.position;
    const dist = currentPos.distanceTo(target.current);
    
    if (dist < 0.1) {
      // Reached destination, wait a bit or pick new one immediately? 
      // For constant motion:
      pickNewTarget();
    } else {
      // Move towards target
      const dir = new THREE.Vector3().subVectors(target.current, currentPos).normalize();
      
      // Face target
      const angle = Math.atan2(dir.x, dir.z);
      // Smooth rotation
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, angle, 0.1);
      
      // Move
      currentPos.add(dir.multiplyScalar(speed.current * delta));
      
      // Walk cycle (bobbing)
      const walkCycle = Math.sin(state.clock.elapsedTime * speed.current * 10);
      group.current.position.y = 0 + Math.abs(walkCycle) * 0.05; 
      
      // Simple "leaning" into turn could be added here
    }
  });

  return (
    <group ref={group} position={origin}>
       {/* Shadow */}
       <mesh rotation={[-Math.PI/2,0,0]} position={[0, 0.01, 0]}>
         <circleGeometry args={[0.1, 8]} />
         <meshBasicMaterial color="#000" opacity={0.3} transparent />
       </mesh>
       {/* Body */}
       <mesh position={[0, 0.15, 0]}>
         <boxGeometry args={[0.12, 0.3, 0.08]} />
         <meshStandardMaterial color={color} />
       </mesh>
       {/* Head */}
       <mesh position={[0, 0.35, 0]}>
         <boxGeometry args={[0.1, 0.1, 0.1]} />
         <meshStandardMaterial color="#fca5a5" /> 
       </mesh>
    </group>
  );
};

// 2. Simple Tree
const Tree: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    {/* Trunk */}
    <Cylinder args={[0.05, 0.08, 0.4]} position={[0, 0.2, 0]}>
      <meshStandardMaterial color="#78350f" />
    </Cylinder>
    {/* Leaves */}
    <Cone args={[0.4, 0.8]} position={[0, 0.7, 0]} color="#166534" />
    <Cone args={[0.3, 0.6]} position={[0, 1.1, 0]} color="#15803d" />
  </group>
);

const Cone = ({ args, position, color }: any) => (
  <mesh position={position}>
    <coneGeometry args={[args[0], args[1], 8]} />
    <meshStandardMaterial color={color} flatShading />
  </mesh>
);

// 3. Roads
const RoadSegment: React.FC<{ 
  position: [number, number, number], 
  rotation?: [number, number, number], 
  length: number, 
  width?: number 
}> = ({ position, rotation = [0, 0, 0], length, width = 2 }) => (
  <group position={position} rotation={rotation}>
    {/* Asphalt */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial color="#374151" />
    </mesh>
    {/* Dashed Line */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[0.15, length]} />
      <meshStandardMaterial color="#ffffff" opacity={0.8} transparent />
    </mesh>
    {/* Sidewalks */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width/2 + 0.1, 0.01, 0]}>
      <planeGeometry args={[0.2, length]} />
      <meshStandardMaterial color="#9ca3af" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width/2 - 0.1, 0.01, 0]}>
      <planeGeometry args={[0.2, length]} />
      <meshStandardMaterial color="#9ca3af" />
    </mesh>
  </group>
);

const Intersection: React.FC<{ position: [number, number, number], size?: number }> = ({ position, size = 2 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.011, position[2]]}>
    <planeGeometry args={[size + 0.4, size + 0.4]} />
    <meshStandardMaterial color="#4b5563" />
  </mesh>
);

const RoadNetwork = () => {
  const outerLimit = 10;
  const length = 22; // Extend slightly past the ring

  return (
    <group position={[0, 0, 0]}>
      {/* --- Vertical Roads (North-South) --- */}
      
      {/* Central Avenue */}
      <RoadSegment position={[0, 0, 0]} length={length} width={2.5} />
      {/* West Ring */}
      <RoadSegment position={[-outerLimit, 0, 0]} length={length} width={1.8} />
      {/* East Ring */}
      <RoadSegment position={[outerLimit, 0, 0]} length={length} width={1.8} />

      {/* --- Horizontal Roads (East-West) --- */}
      
      {/* Central Blvd */}
      <RoadSegment position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={length} width={2.5} />
      {/* North Ring */}
      <RoadSegment position={[0, 0, -outerLimit]} rotation={[0, Math.PI / 2, 0]} length={length} width={1.8} />
      {/* South Ring */}
      <RoadSegment position={[0, 0, outerLimit]} rotation={[0, Math.PI / 2, 0]} length={length} width={1.8} />

      {/* --- Intersections --- */}
      {/* Center */}
      <Intersection position={[0, 0, 0]} size={2.5} />
      
      {/* Corners */}
      <Intersection position={[-outerLimit, 0, -outerLimit]} size={1.8} />
      <Intersection position={[outerLimit, 0, -outerLimit]} size={1.8} />
      <Intersection position={[-outerLimit, 0, outerLimit]} size={1.8} />
      <Intersection position={[outerLimit, 0, outerLimit]} size={1.8} />
      
      {/* Mid-points */}
      <Intersection position={[0, 0, -outerLimit]} size={2.2} />
      <Intersection position={[0, 0, outerLimit]} size={2.2} />
      <Intersection position={[-outerLimit, 0, 0]} size={2.2} />
      <Intersection position={[outerLimit, 0, 0]} size={2.2} />

      {/* --- Side Streets (Small fillers inside districts) --- */}
      {/* Downtown Side Street */}
      <RoadSegment position={[-5, 0, 5]} length={8} width={0.8} rotation={[0, Math.PI/4, 0]} />
      {/* Industrial Access Road */}
      <RoadSegment position={[-5, 0, -5]} length={8} width={0.8} />
    </group>
  );
};

// 4. District Zone
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
  // Generate random buildings deterministically based on district config
  const buildings = useMemo(() => {
    const b = [];
    const seedStr = config.label;
    
    // Simple seeded random function
    const seededRand = (idx: number) => {
      const x = Math.sin(seedStr.length + idx) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < config.buildingCount; i++) {
      const w = 0.5 + seededRand(i * 1) * 0.5;
      const d = 0.5 + seededRand(i * 2) * 0.5;
      const h = config.buildingHeight[0] + seededRand(i * 3) * (config.buildingHeight[1] - config.buildingHeight[0]);
      
      // Position within area size, avoiding absolute center (roads) if we were complex, 
      // but here we are offset by the parent group position
      const x = (seededRand(i * 4) - 0.5) * (config.areaSize - 1);
      const z = (seededRand(i * 5) - 0.5) * (config.areaSize - 1);
      
      b.push({ position: [x, h / 2, z] as [number, number, number], args: [w, h, d] as [number, number, number] });
    }
    return b;
  }, [config]);

  return (
    <group position={config.position}>
      {/* Zone Ground Highlight (Subtle) */}
      <mesh 
        rotation={[-Math.PI/2, 0, 0]} 
        position={[0, 0.02, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(config.id); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[config.areaSize, config.areaSize]} />
        <meshStandardMaterial 
          color={config.color} 
          opacity={0.1} 
          transparent 
        />
      </mesh>

      {/* Selection Box */}
      {isSelected && (
        <lineSegments position={[0, 2, 0]}>
           <edgesGeometry args={[new THREE.BoxGeometry(config.areaSize, 4, config.areaSize)]} />
           <lineBasicMaterial color="yellow" linewidth={2} />
        </lineSegments>
      )}

      {/* Buildings */}
      {buildings.map((b, i) => (
        <group key={i} position={b.position}>
            {/* Main Block */}
            <Box args={b.args}>
               <meshStandardMaterial color={config.color} roughness={0.8} />
            </Box>
            {/* Windows (Visual noise texture simulation) */}
            <Box args={[b.args[0] + 0.05, b.args[1] * 0.8, b.args[2] + 0.05]} position={[0, 0, 0]}>
               <meshStandardMaterial color="#fff" wireframe opacity={0.2} transparent />
            </Box>
            {/* Roof Top Detail */}
            <Box args={[b.args[0]*0.6, 0.2, b.args[2]*0.6]} position={[0, b.args[1]/2 + 0.1, 0]}>
               <meshStandardMaterial color="#333" />
            </Box>
        </group>
      ))}

      {/* Label */}
      <Html position={[0, 3, 0]} center distanceFactor={15}>
         <div className={`text-xs font-bold px-1 py-0.5 rounded text-white shadow-sm whitespace-nowrap ${isSelected ? 'bg-yellow-600' : 'bg-black/50'}`}>
            {config.label}
         </div>
      </Html>

      {/* Agents */}
      {agents.map(agent => (
        <WalkingAgent 
          key={agent.id} 
          agent={agent} 
          origin={[0,0,0]} // Local to the group, so they walk around the center of district
          color={getAgentColor(agent.happiness)}
        />
      ))}
    </group>
  );
};

// UI Info Card
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

  return (
    <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
      <div className="bg-white border-2 border-slate-700 p-4 min-w-[200px] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] font-mono text-slate-800">
        <div className="flex justify-between items-start mb-2 border-b-2 border-slate-200 pb-2">
          <div>
             <h3 className="text-lg font-bold uppercase">{districtId}</h3>
             {activeFilters && <span className="text-[10px] bg-yellow-200 px-1">FILTER ON</span>}
          </div>
          <button onClick={onClose} className="font-bold hover:text-red-600">X</button>
        </div>
        
        {districtAgents.length === 0 ? (
           <p className="text-sm italic">No agents.</p>
        ) : (
          <div className="space-y-1 text-sm">
             <p>Pop: {districtAgents.length}</p>
             <p>Mood: <span style={{ color: getAgentColor(avgHappiness)}}>{avgHappiness}%</span></p>
             <p>Wealth: ${avgWealth.toLocaleString()}</p>
             <div className="mt-2 bg-slate-100 p-2 text-xs border border-slate-300">
                "{districtAgents[0]?.lastThought}"
             </div>
          </div>
        )}
      </div>
    </Html>
  );
};

// Main Component
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

  // Environment Props (Trees)
  const trees = useMemo(() => {
     const t = [];
     for(let i=0; i<30; i++) {
        // Randomly place trees outside the immediate building zones
        const angle = Math.random() * Math.PI * 2;
        const radius = 12 + Math.random() * 8; // Moved trees slightly further out due to bigger road net
        t.push([Math.cos(angle)*radius, 0, Math.sin(angle)*radius] as [number,number,number]);
     }
     return t;
  }, []);

  return (
    <div className="bg-[#87CEEB] h-full relative group"> {/* Sky Blue Background */}
      
      {/* Title */}
      <div className="absolute top-2 left-2 z-10 bg-white border-2 border-slate-800 px-2 py-1 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
        <h3 className="text-slate-800 text-xs font-bold uppercase font-mono">
          City View 2.0
        </h3>
      </div>
      
      {/* Filter Controls */}
      <div className="absolute top-2 right-2 z-20 flex gap-2 font-mono">
         <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value as any)}
            className="bg-white border-2 border-slate-700 text-xs px-1 py-1 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] focus:outline-none"
         >
           <option value="All">Class: All</option>
           {Object.values(SocialClass).map(sc => <option key={sc} value={sc}>{sc}</option>)}
         </select>
         <select 
            value={filterPolitics}
            onChange={(e) => setFilterPolitics(e.target.value as any)}
            className="bg-white border-2 border-slate-700 text-xs px-1 py-1 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] focus:outline-none"
         >
           <option value="All">Politics: All</option>
           {Object.values(PoliticalLeaning).map(pl => <option key={pl} value={pl}>{pl}</option>)}
         </select>
      </div>
      
      <Canvas shadows camera={{ position: [15, 15, 15], fov: 35 }}>
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[20, 30, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#4ade80" /> {/* Grass Green */}
        </mesh>

        <RoadNetwork />

        {/* Trees */}
        {trees.map((pos, i) => <Tree key={i} position={pos} />)}

        {/* Districts */}
        <group>
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
          minDistance={10} 
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2} // Don't go below ground
        />
      </Canvas>
    </div>
  );
};

export default CityMap;