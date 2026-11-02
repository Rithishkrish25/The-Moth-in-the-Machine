import type { InspectionItem } from "./lab-types";

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

export const ENERGY_READINGS = [
  { label: "CORE OUTPUT", value: "98.7", unit: "TW", status: "ELEVATED" as const },
  { label: "TORUS SPIN", value: "4,412", unit: "RPM", status: "NOMINAL" as const },
  { label: "EM FIELD", value: "0.83", unit: "T", status: "NOMINAL" as const },
  { label: "HEAT INDEX", value: "1,247", unit: "°C", status: "ELEVATED" as const },
  { label: "ORB VELOCITY", value: "0.8", unit: "m/s", status: "NOMINAL" as const },
  { label: "PARTICLE FLUX", value: "3.14", unit: "×10⁶", status: "WARNING" as const },
];

export const SCAN_READINGS: { label: string; value: string; anomaly: boolean }[] = [
  { label: "Bio-signature", value: "DETECTED", anomaly: true },
  { label: "Wing frequency", value: "7.0 Hz (SIMULATED)", anomaly: false },
  { label: "Neural activity", value: "ACTIVE — UNKNOWN ORIGIN", anomaly: true },
  { label: "Metallic density", value: "8.2 g/cm³ (SIMULATED)", anomaly: false },
  { label: "Energy absorption", value: "94.3% of field (SIMULATED)", anomaly: true },
  { label: "Specimen mass", value: "0.34 kg (SIMULATED)", anomaly: false },
];

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
