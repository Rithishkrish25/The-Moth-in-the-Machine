"use client";

import { EXPERIMENTS } from "../lab-data";
import type { LabView } from "../lab-types";

interface Props {
  exp01Complete: boolean;
  exp02Complete: boolean;
  exp03Complete: boolean;
  score: number;
  elapsedSeconds: number;
  onStart: (v: LabView) => void;
  onPlayAgain: () => void;
}

const STATUS_COLORS = {
  locked: "text-gray-600 border-white/10 bg-black/20",
  available: "text-cyan-300 border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/10",
  complete: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getGrade(score: number): { label: string; color: string } {
  if (score >= 2500) return { label: "S — EXCEPTIONAL", color: "text-yellow-300" };
  if (score >= 1800) return { label: "A — OUTSTANDING", color: "text-emerald-400" };
  if (score >= 1200) return { label: "B — COMPETENT", color: "text-cyan-300" };
  if (score >= 700)  return { label: "C — ADEQUATE",   color: "text-amber-400" };
  return               { label: "D — NEEDS REVIEW",  color: "text-red-400" };
}

export default function Dashboard({
  exp01Complete,
  exp02Complete,
  exp03Complete,
  score,
  elapsedSeconds,
  onStart,
  onPlayAgain,
}: Props) {
  const completedArr = [exp01Complete, exp02Complete, exp03Complete];
  const totalDone = completedArr.filter(Boolean).length;
  const allComplete = totalDone === 3;

  function getExpState(i: number): "locked" | "available" | "complete" {
    if (completedArr[i]) return "complete";
    if (i === 0) return "available";
    if (completedArr[i - 1]) return "available";
    return "locked";
  }

  // ── All experiments complete: show final game completion screen ────────────
  if (allComplete) {
    const grade = getGrade(score);
    return (
      <div className="flex h-full flex-col items-center justify-center overflow-y-auto p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative border border-cyan-400/40 bg-black/60 p-6 text-center backdrop-blur-md md:p-8">
            <p className="text-[9px] tracking-[0.45em] text-cyan-400">MISSION COMPLETE</p>
            <h2 className="mt-3 text-3xl font-black tracking-wider md:text-4xl">
              LAB CLEARED
            </h2>
            <p className="mt-1 text-[10px] tracking-widest text-gray-400">ALL EXPERIMENTS COMPLETED</p>

            <div className="my-6 h-px bg-cyan-400/20" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="border border-white/10 bg-black/30 p-3">
                <p className="text-[8px] tracking-[0.3em] text-gray-500">FINAL SCORE</p>
                <p className="mt-1 text-2xl font-black text-white">{score.toLocaleString()}</p>
              </div>
              <div className="border border-white/10 bg-black/30 p-3">
                <p className="text-[8px] tracking-[0.3em] text-gray-500">TOTAL TIME</p>
                <p className="mt-1 text-2xl font-black text-cyan-300">{formatTime(elapsedSeconds)}</p>
              </div>
              <div className="col-span-2 border border-white/10 bg-black/30 p-3 text-center">
                <p className="text-[8px] tracking-[0.3em] text-gray-500">PERFORMANCE GRADE</p>
                <p className={`mt-1 text-xl font-black tracking-widest ${grade.color}`}>
                  {grade.label}
                </p>
              </div>
            </div>

            <div className="my-5 h-px bg-white/10" />

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={() => onStart("report")}
                className="w-full border border-cyan-400 bg-cyan-400/10 py-3 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20"
              >
                VIEW FINAL LAB REPORT →
              </button>
              <button
                onClick={onPlayAgain}
                className="w-full border border-white/20 bg-white/5 py-3 text-[10px] font-bold tracking-[0.3em] text-gray-300 transition hover:bg-white/10"
              >
                ↺ PLAY AGAIN
              </button>
            </div>

            <p className="mt-5 text-[8px] tracking-[0.3em] text-gray-600">
              RESTRICTED RESEARCH DIVISION · ACCESS LEVEL 03
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard dashboard ────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-8">
      {/* Top badge */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-cyan-400/20" />
        <p className="text-[9px] tracking-[0.4em] text-cyan-400">RESEARCH OPERATIONS CENTRE</p>
        <div className="h-px flex-1 bg-cyan-400/20" />
      </div>

      {/* Facility overview */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "LEVELS", value: "3" },
          { label: "COMPLETED", value: `${totalDone}` },
          { label: "SPECIMEN", value: "M-001" },
        ].map((s) => (
          <div key={s.label} className="border border-white/10 bg-black/30 p-3 text-center">
            <p className="text-[8px] tracking-[0.3em] text-gray-500">{s.label}</p>
            <p className="mt-1 text-xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
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
      <div className="mb-4 space-y-3">
        <p className="text-[9px] tracking-[0.35em] text-gray-500">EXPERIMENT MISSIONS</p>
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
                    <div className="text-right">
                      <span className="block text-[9px] tracking-widest text-gray-600">🔒 LOCKED</span>
                      <p className="mt-1 text-[8px] text-gray-600">
                        Complete EXP-0{i} first
                      </p>
                    </div>
                  )}
                  {state === "available" && (
                    <button
                      onClick={() => onStart(exp.id as LabView)}
                      className="mt-1 border border-cyan-400/60 bg-cyan-400/10 px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] text-cyan-300 transition hover:bg-cyan-400/20 active:scale-95"
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

      {/* Instructions */}
      <div className="border border-white/5 bg-white/5 p-4">
        <p className="text-[9px] tracking-[0.3em] text-gray-500">HOW TO PLAY</p>
        <ul className="mt-3 space-y-1.5 text-[11px] leading-4 text-gray-400">
          <li>· Click <strong className="text-gray-300">components</strong> in the 3D view to inspect them.</li>
          <li>· Each level unlocks the next — complete them in order.</li>
          <li>· Score points for every correct action. Speed earns a better grade.</li>
          <li>· Keyboard: <strong className="text-gray-300">1 / 2 / 3</strong> navigate machine levels.</li>
          <li>· All scientific readings are <strong className="text-gray-300">SIMULATED</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
