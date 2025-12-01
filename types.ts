// Defined according to PRD FR-006 to FR-017

export interface Indicator {
  name: string; // Original medical term (e.g., "Systolic Blood Pressure")
  value: string; // The value found (e.g., "145")
  status: 'normal' | 'warning' | 'critical'; // Status classification
  metaphor: string; // The "Simpler terms" (e.g., "Like water pressure in a pipe")
  explanation: string; // Friendly explanation
}

export interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  summary: string; // Overall health assessment
  healthScore: number; // 0-100 score
  indicators: Indicator[]; // List of findings
  actionPlan: ActionItem[]; // Step 3 content
}

export enum AppScreen {
  HOME = 'HOME',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export enum ResultStep {
  OVERVIEW = 1,
  DETAILS = 2,
  ACTIONS = 3
}