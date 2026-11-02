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

export interface LabState {
  view: LabView;
  activeFloor: number; // 1 | 2 | 3 — drives the 3D camera
  // Exp 01
  inspectionItems: InspectionItem[];
  exp01Complete: boolean;
  // Exp 02
  reactorOnline: boolean;
  reactorPower: number; // 0–100 simulated %
  exp02Complete: boolean;
  // Exp 03
  scanStarted: boolean;
  scanProgress: number; // 0–100
  mothDiscovered: boolean;
  exp03Complete: boolean;
}
