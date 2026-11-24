export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  cycleDay?: number;
  energy: number; // 1-5
  brainFog: number; // 1-5
  focus: number; // 1-5
  mood: number; // 1-5
  sleepHours?: number;
  cognitiveScore?: number; // 0-100 from Mini-Test
  reactionMs?: number; // avg reaction time in ms
  physicalSymptoms: string[];
  notes?: string;
  createdAt: string;
}

export interface CognitiveInsight {
  averageBrainFog: number;
  averageFocus: number;
  averageEnergy: number;
  trend: "improving" | "stable" | "worsening";
  message: string;
}