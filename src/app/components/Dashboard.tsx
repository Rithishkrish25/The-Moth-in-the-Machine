"use client";

import { EXPERIMENTS } from "../lab-data";
import type { LabView } from "../lab-types";

interface Props {
  exp01Complete: boolean;
  exp02Complete: boolean;
  exp03Complete: boolean;
  onStart: (v: LabView) => void;
}

const STATUS_COLORS = {
  locked: "text-gray-600 border-white/10 bg-black/20",
  available: "text-cyan-300 border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/10",
  complete: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
};

export default function Dashboard({ exp01Complete, exp02Complete, exp03Complete, onStart }: Props) {
  const completedArr = [exp01Complete, exp02Complete, exp03Complete];
  const totalDone = completedArr.filter(Boolean).length;

  function getExpState(i: number): "locked" | "available" | "complete" {
    if (completedArr[i]) return "complete";
    if (i === 0) return "available";
    if (completedArr[i - 1]) return "available";
    return "locked";
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-8">
      {/* Top badge */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-cyan-400/20" />
        <p className="text-[9px] tracking-[0.4em] text-cyan-400">RESEARCH OPERATIONS CENTRE</p>
        <div className="h-px flex-1 bg-cyan-400/20" />
      </div>

      {/* Facility overview */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "EXPERIMENTS", value: "3" },
          { label: "COMPLETED", value: `${totalDone}` },
          { label: "SPECIMEN ID", value: "M-001" },
        ].map((s) => (
          <div key={s.label} className="border border-white/10 bg-black/30 p-3 text-center">
            <p className="text-[8px] tracking-[0.3em] text-gray-500">{s.label}</p>
            <p className="mt-1 text-xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex justify-between">
          <p className="text-[9px] tracking-widest text-gray-500">OVERALL PROGRESS</p>
          <p className="text-[9px] font-bold text-cyan-300">{Math.round((totalDone / 3) * 100)}%</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-700"
            style={{ width: `${(totalDone / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Experiment cards */}
      <div className="mb-6 space-y-3">
        <p className="text-[9px] tracking-[0.35em] text-gray-500">AVAILABLE EXPERIMENTS</p>
        {EXPERIMENTS.map((exp, i) => {
          const state = getExpState(i);
          return (
            <div
              key={exp.id}
              className={`border p-4 transition-all duration-300 ${STATUS_COLORS[state]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] tracking-[0.35em] opacity-60">{exp.code}</p>
                  <h3 className="mt-1 text-sm font-black tracking-wider">{exp.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-4 opacity-70">{exp.objective}</p>
                </div>
                <div className="shrink-0 text-right">
                  {state === "complete" && (
                    <span className="block text-[9px] font-bold tracking-widest text-emerald-400">✓ DONE</span>
                  )}
                  {state === "locked" && (
                    <span className="block text-[9px] tracking-widest text-gray-600">LOCKED</span>
                  )}
                  {state === "available" && (
                    <button
                      onClick={() => onStart(exp.id as LabView)}
                      className="mt-1 border border-cyan-400/60 bg-cyan-400/10 px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] text-cyan-300 transition hover:bg-cyan-400/20"
                    >
                      START →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Final report */}
      {totalDone === 3 && (
        <button
          onClick={() => onStart("report")}
          className="w-full border border-cyan-400 bg-cyan-400/10 py-4 text-[10px] font-bold tracking-[0.35em] text-cyan-300 transition hover:bg-cyan-400/20"
        >
          VIEW FINAL LAB REPORT →
        </button>
      )}

      {/* Instructions */}
      <div className="mt-6 border border-white/5 bg-white/5 p-4">
        <p className="text-[9px] tracking-[0.3em] text-gray-500">RESEARCHER INSTRUCTIONS</p>
        <ul className="mt-3 space-y-1.5 text-[11px] leading-4 text-gray-400">
          <li>· Complete experiments in sequence — each unlocks the next.</li>
          <li>· Use the 3D laboratory view to interact with machine components.</li>
          <li>· All readings shown are simulated for research activity purposes.</li>
          <li>· Keyboard shortcuts: 1 / 2 / 3 navigate machine levels.</li>
        </ul>
      </div>
    </div>
  );
}
