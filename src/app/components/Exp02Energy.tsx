"use client";

import { useEffect, useState } from "react";
import { ENERGY_READINGS } from "../lab-data";

const STATUS_STYLE = {
  NOMINAL: "text-emerald-400",
  ELEVATED: "text-amber-400",
  WARNING: "text-red-400",
};

interface Props {
  reactorOnline: boolean;
  reactorPower: number;
  onToggleReactor: () => void;
  onComplete: () => void;
  onBack: () => void;
  isComplete: boolean;
}

export default function Exp02Energy({
  reactorOnline,
  reactorPower,
  onToggleReactor,
  onComplete,
  onBack,
  isComplete,
}: Props) {
  // Simulated fluctuating readings that update while reactor is online
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!reactorOnline) return;
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, [reactorOnline]);

  function simValue(base: string, idx: number): string {
    if (!reactorOnline) return "—";
    const numeric = parseFloat(base.replace(",", ""));
    if (isNaN(numeric)) return base;
    const jitter = Math.sin(tick * 0.7 + idx * 1.3) * numeric * 0.03;
    const result = numeric + jitter;
    if (base.includes(",")) return result.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return result.toFixed(base.includes(".") ? 2 : 0);
  }

  const canComplete = reactorOnline && reactorPower >= 80;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-8">
      <button onClick={onBack} className="mb-4 self-start text-[9px] tracking-widest text-gray-500 transition hover:text-cyan-400">
        ← BACK TO DASHBOARD
      </button>

      <div className="mb-1 flex items-center gap-2">
        <span className="border border-cyan-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-cyan-400">EXP-02</span>
        <span className="text-[9px] tracking-widest text-gray-600">ENERGY REGULATION</span>
      </div>

      <h2 className="mt-1 text-xl font-black tracking-wider md:text-2xl">REACTOR CONTROL</h2>

      <p className="mt-2 text-[11px] leading-5 text-gray-400">
        Activate the central reactor and monitor the energy network. Maintain power output
        above 80% to complete this experiment. All readings are simulated.
      </p>

      {/* Reactor power control */}
      <div className="my-5 border border-white/10 bg-black/30 p-4">
        <p className="mb-3 text-[9px] tracking-[0.35em] text-gray-500">REACTOR MASTER CONTROL</p>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-2xl font-black tracking-wider ${reactorOnline ? "text-cyan-300" : "text-gray-600"}`}>
              {reactorOnline ? `${reactorPower.toFixed(1)}%` : "OFFLINE"}
            </p>
            <p className="mt-0.5 text-[9px] tracking-widest text-gray-500">POWER OUTPUT (SIMULATED)</p>
          </div>

          <button
            onClick={onToggleReactor}
            className={`border px-5 py-3 text-[10px] font-bold tracking-[0.25em] transition-all duration-300 ${
              reactorOnline
                ? "border-red-400/60 bg-red-400/10 text-red-400 hover:bg-red-400/20"
                : "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
            }`}
          >
            {reactorOnline ? "POWER DOWN" : "POWER UP"}
          </button>
        </div>

        {/* Power bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden bg-white/10">
            <div
              className={`h-full transition-all duration-1000 ${
                reactorOnline ? "bg-cyan-400" : "bg-white/10"
              }`}
              style={{ width: `${reactorOnline ? reactorPower : 0}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[8px] text-gray-600">
            <span>0%</span>
            <span className="text-amber-400/60">80% THRESHOLD</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Live readings */}
      <p className="mb-2 text-[9px] tracking-[0.35em] text-gray-500">LIVE ENERGY READINGS</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {ENERGY_READINGS.map((r, i) => (
          <div key={r.label} className="border border-white/10 bg-black/20 p-3">
            <p className="text-[8px] tracking-widest text-gray-500">{r.label}</p>
            <p className={`mt-1 text-base font-black ${reactorOnline ? STATUS_STYLE[r.status] : "text-gray-700"}`}>
              {simValue(r.value, i)}
              <span className="ml-1 text-[10px] font-normal opacity-70">{r.unit}</span>
            </p>
            {reactorOnline && (
              <p className={`mt-0.5 text-[8px] tracking-widest ${STATUS_STYLE[r.status]}`}>{r.status}</p>
            )}
          </div>
        ))}
      </div>

      {/* Status note */}
      {reactorOnline && (
        <div className="mt-4 border border-amber-400/20 bg-amber-400/5 p-3">
          <p className="text-[9px] tracking-[0.3em] text-amber-400">SYSTEM NOTICE</p>
          <p className="mt-1 text-[11px] leading-4 text-gray-300">
            Reactor operating within expected parameters. Energy orbs cycling through transmission network.
            Readings shown are simulated for research purposes.
          </p>
        </div>
      )}

      {/* Complete */}
      <div className="mt-6">
        {isComplete ? (
          <div className="border border-emerald-400/30 bg-emerald-400/5 p-3 text-center">
            <p className="text-[10px] font-bold tracking-widest text-emerald-400">✓ EXPERIMENT COMPLETE</p>
          </div>
        ) : canComplete ? (
          <button
            onClick={onComplete}
            className="w-full border border-cyan-400 bg-cyan-400/10 py-4 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20"
          >
            VERIFY READINGS → COMPLETE EXP-02
          </button>
        ) : (
          <div className="border border-white/10 p-3 text-center">
            <p className="text-[10px] text-gray-500">
              Power up the reactor and reach 80% output to complete this experiment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
