export enum Neighborhood {
  Downtown = 'Downtown',
  Suburbs = 'Suburbs',
  Industrial = 'Industrial Zone',
  Waterfront = 'Waterfront',
}

export enum PoliticalLeaning {
  Liberal = 'Liberal',
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Apolitical = 'Apolitical',
}

export enum SocialClass {
  LowIncome = 'Low Income',
  MiddleClass = 'Middle Class',
  Wealthy = 'Wealthy',
}

export interface Agent {
  id: string;
  name: string;
  age: number;
  occupation: string;
  socialClass: SocialClass;
  neighborhood: Neighborhood;
  politics: PoliticalLeaning;
  happiness: number; // 0-100
  wealth: number; // Abstract units
  personality: string[];
  lastThought: string;
  lastAction: string;
}

export interface CityMetrics {
  avgHappiness: number;
  unemployment: number;
  gdp: number; // In millions
  crimeRate: number;
  population: number;
  govApproval: number;
  turn: number;
}

export interface TurnResult {
  narrative: string;
  metrics: CityMetrics;
  agentSamples: {
    agentId: string; // Refers to an agent in our array (we will match by closest archetype if exact ID not found, or generate new thought)
    name: string;
    thought: string;
    action: string;
  }[];
  globalModifiers: {
    happinessDelta: number;
    wealthDelta: number;
    crimeDelta: number;
    unemploymentDelta: number;
  };
}

export interface SimulationState {
  metrics: CityMetrics;
  agents: Agent[];
  history: {
    turn: number;
    action: string;
    narrative: string;
  }[];
  isGameOver: boolean;
  gameStatus: 'playing' | 'won' | 'lost';
}