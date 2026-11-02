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
  const completedCount = [exp01Complete, exp02Complete, exp03Complete].filter(Boolean).length;

  return (
    <header className="pointer-events-auto relative z-20 flex items-center justify-between border-b border-white/10 bg-[#050914]/80 px-4 py-3 backdrop-blur-md md:px-10 md:py-4">
      {/* Left: facility + title */}
      <div>
        <p className="text-[8px] font-semibold tracking-[0.35em] text-cyan-400 md:text-[9px] md:tracking-[0.4em]">
          M.I.M. RESEARCH FACILITY · 2049
        </p>
        <button
          onClick={() => onNav("dashboard")}
          className="mt-0.5 text-xs font-black tracking-[0.12em] text-white transition hover:text-cyan-300 md:text-base md:tracking-[0.15em]"
        >
          THE MOTH IN THE MACHINE
        </button>
      </div>

      {/* Centre: current view tag (desktop) */}
      <div className="hidden md:block">
        <p className="text-[9px] tracking-[0.4em] text-cyan-400/70">{VIEW_LABELS[view]}</p>
        <div className="mt-1 flex items-center gap-2">
          {(["exp01", "exp02", "exp03"] as const).map((v, i) => {
            const done = [exp01Complete, exp02Complete, exp03Complete][i];
            return (
              <span
                key={v}
                className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                  done ? "bg-cyan-400" : "bg-white/10"
                }`}
              />
            );
          })}
          <span className="ml-1 text-[9px] tracking-widest text-gray-500">
            {completedCount}/3 COMPLETE
          </span>
        </div>
      </div>

      {/* Right: status */}
      <div className="text-right">
        <p className="text-[8px] tracking-widest text-gray-500 md:text-[9px]">FACILITY STATUS</p>
        <p className="mt-1 flex items-center justify-end gap-1.5 text-[10px] font-bold tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 md:h-2 md:w-2" />
          ONLINE
        </p>
      </div>
    </header>
  );
}
