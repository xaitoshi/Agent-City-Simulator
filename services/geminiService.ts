import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CityMetrics, TurnResult, SocialClass, Neighborhood, PoliticalLeaning } from "../types";

// Schema definition for the simulation output
const turnResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "A vivid, immersive paragraph describing the outcome of the user's action and the current state of the city.",
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        avgHappiness: { type: Type.NUMBER },
        unemployment: { type: Type.NUMBER },
        gdp: { type: Type.NUMBER },
        crimeRate: { type: Type.NUMBER },
        population: { type: Type.NUMBER },
        govApproval: { type: Type.NUMBER },
        turn: { type: Type.NUMBER },
      },
      required: ["avgHappiness", "unemployment", "gdp", "crimeRate", "population", "govApproval", "turn"],
    },
    agentSamples: {
      type: Type.ARRAY,
      description: "5 representative agent reactions.",
      items: {
        type: Type.OBJECT,
        properties: {
          agentId: { type: Type.STRING, description: "A placeholder ID like 'agent-X' or a description of the archetype (e.g. 'Wealthy Waterfront Conservative')." },
          name: { type: Type.STRING },
          thought: { type: Type.STRING, description: "Chain-of-thought reasoning." },
          action: { type: Type.STRING, description: "Specific action taken (e.g., 'Started a protest', 'Bought gold')." },
        },
        required: ["name", "thought", "action"],
      },
    },
    globalModifiers: {
      type: Type.OBJECT,
      description: "Deltas to apply to the rest of the population's stats.",
      properties: {
        happinessDelta: { type: Type.NUMBER },
        wealthDelta: { type: Type.NUMBER },
        crimeDelta: { type: Type.NUMBER },
        unemploymentDelta: { type: Type.NUMBER },
      },
      required: ["happinessDelta", "wealthDelta", "crimeDelta", "unemploymentDelta"],
    },
  },
  required: ["narrative", "metrics", "agentSamples", "globalModifiers"],
};

export const simulateTurn = async (
  currentMetrics: CityMetrics,
  userAction: string,
  turnNumber: number
): Promise<TurnResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are the game engine for "Neo Haven", a realistic city simulator.
    
    Current State:
    - Turn: ${turnNumber}
    - Metrics: ${JSON.stringify(currentMetrics)}
    
    User Action (Mayor's Decree/Event): "${userAction}"
    
    Task:
    1. Analyze the impact of the user's action on the city. Consider economic theories, sociology, and political science.
    2. Determine 5 distinct agent reactions representing different demographics (e.g., Low Income vs Wealthy, Liberal vs Conservative).
    3. Calculate new city metrics. 
       - Win Condition: Approval > 70% after 10 turns.
       - Lose Condition: Approval < 30%.
    4. Provide global modifiers to update the 100 simulation agents programmatically (e.g., if tax rises, wealthDelta might be negative).
    
    Constraints:
    - Keep narrative immersive and concise (max 3 sentences).
    - Ensure consequences are logical but can include unintended side effects.
    - GDP is in millions.
    - Returns strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: turnResponseSchema,
        thinkingConfig: { thinkingBudget: 1024 }, // Slight thinking for better causality
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const result = JSON.parse(resultText) as TurnResult;
    
    // Ensure turn number increments
    result.metrics.turn = turnNumber + 1;
    
    return result;
  } catch (error) {
    console.error("Simulation error:", error);
    // Fallback in case of severe error
    return {
      narrative: "Communication with the city council (AI) failed. The city stands still.",
      metrics: { ...currentMetrics, turn: turnNumber },
      agentSamples: [],
      globalModifiers: { happinessDelta: 0, wealthDelta: 0, crimeDelta: 0, unemploymentDelta: 0 },
    };
  }
};