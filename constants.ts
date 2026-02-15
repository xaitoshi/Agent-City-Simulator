import { Agent, Neighborhood, PoliticalLeaning, SocialClass } from './types';

export const INITIAL_METRICS = {
  avgHappiness: 65,
  unemployment: 5,
  gdp: 500, // $500M
  crimeRate: 15,
  population: 100,
  govApproval: 55,
  turn: 1,
};

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Avery', 'Dakota', 'Sam', 'Pat', 'Drew', 'Skyler', 'Cameron', 'Reese', 'Charlie', 'Peyton', 'River', 'Sage'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const OCCUPATIONS = {
  [SocialClass.LowIncome]: ['Factory Worker', 'Server', 'Cleaner', 'Retail Clerk', 'Laborer', 'Artist', 'Student', 'Unemployed'],
  [SocialClass.MiddleClass]: ['Teacher', 'Nurse', 'Accountant', 'Manager', 'Developer', 'Police Officer', 'Small Business Owner', 'Journalist'],
  [SocialClass.Wealthy]: ['CEO', 'Investor', 'Surgeon', 'Lawyer', 'Politician', 'Tech Executive', 'Heir/Heiress'],
};

const PERSONALITIES = ['Risk-averse', 'Entrepreneurial', 'Community-oriented', 'Selfish', 'Idealistic', 'Cynical', 'Optimistic', 'Anxious', 'Rebellious', 'Traditional'];

const randomEnum = <T extends object>(anEnum: T): T[keyof T] => {
  const enumValues = Object.keys(anEnum) as Array<keyof T>;
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return anEnum[enumValues[randomIndex]];
};

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateAgents = (count: number): Agent[] => {
  const agents: Agent[] = [];

  for (let i = 0; i < count; i++) {
    // Determine class based on distribution: 20% Low, 50% Middle, 30% Wealthy/Varied
    let sClass = SocialClass.MiddleClass;
    const r = Math.random();
    if (r < 0.25) sClass = SocialClass.LowIncome;
    else if (r > 0.8) sClass = SocialClass.Wealthy;

    const neighborhood = sClass === SocialClass.Wealthy ? Neighborhood.Waterfront :
                         sClass === SocialClass.LowIncome ? Neighborhood.Industrial :
                         Math.random() > 0.5 ? Neighborhood.Suburbs : Neighborhood.Downtown;

    // Wealth baseline
    const baseWealth = sClass === SocialClass.Wealthy ? 80000 :
                       sClass === SocialClass.MiddleClass ? 40000 : 15000;
    const wealth = baseWealth + Math.floor(Math.random() * 10000);

    const job = randomItem(OCCUPATIONS[sClass]);
    
    agents.push({
      id: `agent-${i + 1}`,
      name: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
      age: 18 + Math.floor(Math.random() * 60),
      occupation: job,
      socialClass: sClass,
      neighborhood: neighborhood,
      politics: randomEnum(PoliticalLeaning),
      happiness: 50 + Math.floor(Math.random() * 40), // Start generally okay
      wealth: wealth,
      personality: [randomItem(PERSONALITIES), randomItem(PERSONALITIES)],
      lastThought: "Just hoping for a stable future.",
      lastAction: "Working",
    });
  }
  return agents;
};