// ── Navigation types (legacy, kept for LabReport compatibility) ────────────
export type LabView =
  | "dashboard"
  | "exp01"
  | "exp02"
  | "exp03"
  | "report";

export interface InspectionItem {
  id: string;
  component: string;
  location: string;
  function: string;
  status: "NOMINAL" | "ELEVATED" | "CRITICAL";
  checked: boolean;
}

export interface EnergyReading {
  label: string;
  value: string;
  unit: string;
  status: "NOMINAL" | "ELEVATED" | "WARNING";
}

export interface ScanReading {
  label: string;
  value: string;
  anomaly: boolean;
}

// Legacy state shape (kept for LabReport)
export interface LabState {
  view: LabView;
  activeFloor: number;
  inspectionItems: InspectionItem[];
  exp01Complete: boolean;
  reactorOnline: boolean;
  reactorPower: number;
  exp02Complete: boolean;
  scanStarted: boolean;
  scanProgress: number;
  mothDiscovered: boolean;
  exp03Complete: boolean;
}

// ── First-person game types ────────────────────────────────────────────────

export type GamePhase = "start" | "playing" | "complete" | "report";

export type MissionIndex = 1 | 2 | 3;

export interface FeedbackEvent {
  id: number;
  message: string;
  points: number;
  type: "correct" | "wrong" | "info";
}

export interface GameState {
  score: number;
  elapsedSeconds: number;
  timerRunning: boolean;
  feedback: FeedbackEvent | null;
  scoredActions: Set<string>;
}

export interface FacilityInteractable {
  id: string;
  label: string;
  pos: [number, number, number];
  radius: number;
  mission: MissionIndex;
}
