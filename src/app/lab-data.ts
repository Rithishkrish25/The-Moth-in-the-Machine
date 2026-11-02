import type { InspectionItem, FacilityInteractable } from "./lab-types";

export const INSPECTION_ITEMS: InspectionItem[] = [
  {
    id: "shell-01",
    component: "Outer Shell Plating",
    location: "Level 01 / Perimeter",
    function: "Structural containment and environmental isolation",
    status: "NOMINAL",
    checked: false,
  },
  {
    id: "beacon-01",
    component: "Warning Beacons",
    location: "Level 01 / Sector A & B",
    function: "Proximity alert and personnel hazard signalling",
    status: "ELEVATED",
    checked: false,
  },
  {
    id: "column-01",
    component: "Structural Columns",
    location: "Level 01–03 / Ring perimeter",
    function: "Load-bearing vertical support between floor plates",
    status: "NOMINAL",
    checked: false,
  },
  {
    id: "reactor-ring",
    component: "Central Reactor Ring",
    location: "Level 02 / Core",
    function: "Primary energy containment and torus distribution",
    status: "ELEVATED",
    checked: false,
  },
  {
    id: "containment-01",
    component: "Moth Containment Chamber",
    location: "Level 03 / Apex",
    function: "Specimen isolation and bio-mechanical monitoring",
    status: "CRITICAL",
    checked: false,
  },
];

// Points awarded per inspection item (by id)
export const INSPECTION_POINTS: Record<string, number> = {
  "shell-01": 100,
  "beacon-01": 150,
  "column-01": 100,
  "reactor-ring": 150,
  "containment-01": 200,
};

export const ENERGY_READINGS = [
  { label: "CORE OUTPUT",   value: "98.7",  unit: "TW",   status: "ELEVATED" as const },
  { label: "TORUS SPIN",    value: "4,412", unit: "RPM",  status: "NOMINAL"  as const },
  { label: "EM FIELD",      value: "0.83",  unit: "T",    status: "NOMINAL"  as const },
  { label: "HEAT INDEX",    value: "1,247", unit: "°C",   status: "ELEVATED" as const },
  { label: "ORB VELOCITY",  value: "0.8",   unit: "m/s",  status: "NOMINAL"  as const },
  { label: "PARTICLE FLUX", value: "3.14",  unit: "×10⁶", status: "WARNING"  as const },
];

// EXP-02 game target
export const REACTOR_TARGET_POWER = 80; // %
export const REACTOR_BONUS_POINTS = 500;

export const SCAN_READINGS: { label: string; value: string; anomaly: boolean }[] = [
  { label: "Bio-signature",     value: "DETECTED",                   anomaly: true  },
  { label: "Wing frequency",    value: "7.0 Hz (SIMULATED)",         anomaly: false },
  { label: "Neural activity",   value: "ACTIVE — UNKNOWN ORIGIN",    anomaly: true  },
  { label: "Metallic density",  value: "8.2 g/cm³ (SIMULATED)",      anomaly: false },
  { label: "Energy absorption", value: "94.3% of field (SIMULATED)", anomaly: true  },
  { label: "Specimen mass",     value: "0.34 kg (SIMULATED)",        anomaly: false },
];

export const SCAN_ANOMALY_POINTS  = 150;
export const MOTH_CONTACT_POINTS  = 100;
export const SCAN_COMPLETE_POINTS = 300;

export const EXPERIMENTS = [
  {
    id: "exp01",
    code: "EXP-01",
    title: "MACHINE INSPECTION",
    objective: "Systematically inspect all five critical machine components and verify their operational status.",
    level: 1,
    requiredFor: "EXP-02",
  },
  {
    id: "exp02",
    code: "EXP-02",
    title: "ENERGY REGULATION",
    objective: "Activate the central reactor, monitor live energy readings, and verify stable power output.",
    level: 2,
    requiredFor: "EXP-03",
  },
  {
    id: "exp03",
    code: "EXP-03",
    title: "MOTH INVESTIGATION",
    objective: "Initiate a full bio-mechanical scan of the Specimen M-001 inside the containment chamber.",
    level: 3,
    requiredFor: null,
  },
] as const;

// ── First-person facility interactables ────────────────────────────────────────
// Mission 1 inspection: player walks around the machine perimeter (z ≈ 6-10 = approach zone).
// Mission 2 reactor panel: terminal at west corridor (-10, 0, 5).
// Mission 3 moth scanner: terminal at east-south zone (10, 0, -18).

export const FACILITY_INTERACTABLES: FacilityInteractable[] = [
  // Mission 1 — five inspection targets around the machine
  { id: "shell-01",       label: "INSPECT: OUTER SHELL PLATING",   pos: [5.5,  1.1,  3.5], radius: 4.5, mission: 1 },
  { id: "beacon-01",      label: "INSPECT: WARNING BEACONS",       pos: [-2.8, 1.8,  5.8], radius: 3.5, mission: 1 },
  { id: "column-01",      label: "INSPECT: STRUCTURAL COLUMNS",    pos: [4.35, 1.5,  3.5], radius: 4.0, mission: 1 },
  { id: "reactor-ring",   label: "INSPECT: CENTRAL REACTOR RING",  pos: [0,    0,    7.0],  radius: 4.5, mission: 1 },
  { id: "containment-01", label: "INSPECT: CONTAINMENT CHAMBER",   pos: [-5.5, 0,    4.0],  radius: 4.5, mission: 1 },
  // Mission 2 — reactor control terminal
  { id: "reactor-panel",  label: "OPERATE: REACTOR CONTROL PANEL", pos: [-10,  0,    5.0],  radius: 3.5, mission: 2 },
  // Mission 3 — specimen scanner terminal
  { id: "moth-scanner",   label: "ACTIVATE: SPECIMEN SCANNER",     pos: [10,   0,   -18.0], radius: 4.5, mission: 3 },
];
