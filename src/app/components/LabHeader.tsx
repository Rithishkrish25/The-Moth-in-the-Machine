"use client";

import type { LabView } from "../lab-types";

const VIEW_LABELS: Record<LabView, string> = {
  dashboard: "DASHBOARD",
  exp01: "EXP-01 / INSPECTION",
  exp02: "EXP-02 / ENERGY",
  exp03: "EXP-03 / MOTH",
  report: "LAB REPORT",
};

interface Props {
  view: LabView;
  exp01Complete: boolean;
  exp02Complete: boolean;
  exp03Complete: boolean;
  onNav: (v: LabView) => void;
}

export default function LabHeader({
  view,
  exp01Complete,
  exp02Complete,
  exp03Complete,
  onNav,
}: Props) {
  return (
    <header className="pointer-events-auto relative z-20 flex items-center justify-between border-b border-white/10 bg-[#050914]/80 px-4 py-2.5 backdrop-blur-md md:px-10 md:py-3">
      {/* Left: facility + title */}
      <div>
        <p className="text-[7px] font-semibold tracking-[0.35em] text-cyan-400 md:text-[8px] md:tracking-[0.4em]">
          M.I.M. RESEARCH FACILITY · 2049
        </p>
        <button
          onClick={() => onNav("dashboard")}
          className="mt-0.5 text-[10px] font-black tracking-[0.12em] text-white transition hover:text-cyan-300 md:text-sm md:tracking-[0.15em]"
        >
          THE MOTH IN THE MACHINE
        </button>
      </div>

      {/* Centre: current view tag (desktop only) */}
      <div className="hidden md:block">
        <p className="text-center text-[8px] tracking-[0.4em] text-cyan-400/70">{VIEW_LABELS[view]}</p>
      </div>

      {/* Right: facility status */}
      <div className="text-right">
        <p className="text-[7px] tracking-widest text-gray-500 md:text-[8px]">FACILITY STATUS</p>
        <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[9px] font-bold tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          ONLINE
        </p>
      </div>
    </header>
  );
}
