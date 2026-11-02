"use client";

import { useEffect, useState } from "react";
import { ENERGY_READINGS, REACTOR_TARGET_POWER, REACTOR_BONUS_POINTS } from "../lab-data";

const STATUS_STYLE = {
  NOMINAL:  "text-emerald-400",
  ELEVATED: "text-amber-400",
  WARNING:  "text-red-400",
};

interface Props {
  reactorOnline: boolean;
  reactorPower: number;
  onToggleReactor: () => void;
  onComplete: () => void;
  onBack: () => void;
  isComplete: boolean;
  // Callback when target first crossed (for scoring — parent deduplicates)
  onTargetReached: () => void;
  targetReachedScored: boolean;
}

export default function Exp02Energy({
  reactorOnline,
  reactorPower,
  onToggleReactor,
  onComplete,
  onBack,
  isComplete,
  onTargetReached,
  targetReachedScored,
}: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!reactorOnline) return;
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, [reactorOnline]);

  // Notify parent when threshold first crossed
  useEffect(() => {
    if (reactorOnline && reactorPower >= REACTOR_TARGET_POWER && !targetReachedScored) {
      onTargetReached();
    }
  }, [reactorPower, reactorOnline, targetReachedScored, onTargetReached]);

  function simValue(base: string, idx: number): string {
    if (!reactorOnline) return "—";
    const numeric = parseFloat(base.replace(",", ""));
    if (isNaN(numeric)) return base;
    const jitter = Math.sin(tick * 0.7 + idx * 1.3) * numeric * 0.03;
    const result = numeric + jitter;
    if (base.includes(",")) return result.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return result.toFixed(base.includes(".") ? 2 : 0);
  }

  const canComplete = reactorOnline && reactorPower >= REACTOR_TARGET_POWER;

  // Live feedback message
  let liveFeedback: { msg: string; cls: string } | null = null;
  if (reactorOnline) {
    if (reactorPower >= REACTOR_TARGET_POWER) {
      liveFeedback = { msg: "✓ TARGET REACHED — STABLE OUTPUT", cls: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" };
    } else if (reactorPower >= REACTOR_TARGET_POWER * 0.6) {
      liveFeedback = { msg: "↑ APPROACHING TARGET — HOLD STEADY", cls: "text-amber-400 border-amber-400/30 bg-amber-400/5" };
    } else {
      liveFeedback = { msg: "⚡ OUTPUT TOO LOW — MAINTAIN POWER", cls: "text-red-400 border-red-400/30 bg-red-400/5" };
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
      <button onClick={onBack} className="mb-3 self-start text-[9px] tracking-widest text-gray-500 transition hover:text-cyan-400">
        ← BACK
      </button>

      <div className="mb-1 flex items-center gap-2">
        <span className="border border-cyan-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-cyan-400">EXP-02</span>
        <span className="text-[9px] tracking-widest text-gray-600">ENERGY REGULATION</span>
      </div>

      <h2 className="mt-1 text-lg font-black tracking-wider md:text-xl">REACTOR CONTROL</h2>

      {/* Objective */}
      <div className="mt-2 border-l-2 border-cyan-400/60 bg-cyan-400/5 px-3 py-2">
        <p className="text-[9px] tracking-[0.3em] text-cyan-400">OBJECTIVE</p>
        <p className="mt-0.5 text-[11px] text-gray-300">
          Power up the reactor and hold output above{" "}
          <strong className="text-white">{REACTOR_TARGET_POWER}%</strong> to stabilise
          the energy network. Earn <strong className="text-yellow-300">+{REACTOR_BONUS_POINTS} pts</strong> for hitting the target.
        </p>
      </div>

      {/* Target + power display */}
      <div className="my-4 border border-white/10 bg-black/30 p-4">
        <div className="mb-2 flex items-center justify-between text-[9px] text-gray-500">
          <span className="tracking-[0.35em]">REACTOR MASTER CONTROL</span>
          <span className="tracking-widest text-amber-400/70">
            TARGET: {REACTOR_TARGET_POWER}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-2xl font-black tabular-nums tracking-wider ${reactorOnline ? (reactorPower >= REACTOR_TARGET_POWER ? "text-emerald-400" : "text-cyan-300") : "text-gray-600"}`}>
              {reactorOnline ? `${reactorPower.toFixed(1)}%` : "OFFLINE"}
            </p>
            <p className="mt-0.5 text-[9px] tracking-widest text-gray-500">POWER OUTPUT (SIMULATED)</p>
          </div>

          <button
            onClick={onToggleReactor}
            className={`border px-5 py-3 text-[10px] font-bold tracking-[0.25em] transition-all duration-300 active:scale-95 ${
              reactorOnline
                ? "border-red-400/60 bg-red-400/10 text-red-400 hover:bg-red-400/20"
                : "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
            }`}
          >
            {reactorOnline ? "POWER DOWN" : "POWER UP"}
          </button>
        </div>

        {/* Dual power bar: progress + target line */}
        <div className="relative mt-4">
          <div className="h-3 w-full overflow-hidden bg-white/10">
            <div
              className={`h-full transition-all duration-500 ${
                reactorPower >= REACTOR_TARGET_POWER
                  ? "bg-emerald-400"
                  : reactorOnline
                  ? "bg-cyan-400"
                  : "bg-white/10"
              }`}
              style={{ width: `${reactorOnline ? reactorPower : 0}%` }}
            />
          </div>
          {/* Target marker */}
          <div
            className="absolute top-0 h-3 w-0.5 bg-amber-400"
            style={{ left: `${REACTOR_TARGET_POWER}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[8px] text-gray-600">
          <span>0%</span>
          <span className="text-amber-400/70">{REACTOR_TARGET_POWER}% TARGET</span>
          <span>100%</span>
        </div>
      </div>

      {/* Live feedback */}
      {liveFeedback && (
        <div className={`mb-3 border p-2 text-center ${liveFeedback.cls}`}>
          <p className="text-[10px] font-bold tracking-[0.25em]">{liveFeedback.msg}</p>
        </div>
      )}

      {/* Bonus points notice */}
      {targetReachedScored && (
        <div className="mb-3 border border-yellow-400/30 bg-yellow-400/5 p-2 text-center">
          <p className="text-[9px] font-bold tracking-widest text-yellow-300">
            ⭐ +{REACTOR_BONUS_POINTS} PTS — TARGET BONUS AWARDED
          </p>
        </div>
      )}

      {/* Live readings */}
      <p className="mb-2 text-[9px] tracking-[0.35em] text-gray-500">LIVE ENERGY READINGS (SIMULATED)</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {ENERGY_READINGS.map((r, i) => (
          <div key={r.label} className="border border-white/10 bg-black/20 p-2.5">
            <p className="text-[8px] tracking-widest text-gray-500">{r.label}</p>
            <p className={`mt-1 text-sm font-black ${reactorOnline ? STATUS_STYLE[r.status] : "text-gray-700"}`}>
              {simValue(r.value, i)}
              <span className="ml-1 text-[9px] font-normal opacity-70">{r.unit}</span>
            </p>
            {reactorOnline && (
              <p className={`mt-0.5 text-[7px] tracking-widest ${STATUS_STYLE[r.status]}`}>{r.status}</p>
            )}
          </div>
        ))}
      </div>

      {/* Hint */}
      {!reactorOnline && (
        <div className="mt-3 border border-amber-400/20 bg-amber-400/5 p-2">
          <p className="text-[9px] text-amber-400">
            💡 HINT: Press POWER UP then watch the 3D reactor ring spin up. Hold above {REACTOR_TARGET_POWER}%.
          </p>
        </div>
      )}

      {/* Complete */}
      <div className="mt-4">
        {isComplete ? (
          <div className="border border-emerald-400/30 bg-emerald-400/5 p-3 text-center">
            <p className="text-[10px] font-bold tracking-widest text-emerald-400">✓ EXPERIMENT COMPLETE</p>
          </div>
        ) : canComplete ? (
          <button
            onClick={onComplete}
            className="w-full border border-cyan-400 bg-cyan-400/10 py-4 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20 active:scale-95"
          >
            ✓ VERIFY READINGS → COMPLETE EXP-02
          </button>
        ) : (
          <div className="border border-white/10 p-3 text-center">
            <p className="text-[10px] text-gray-500">
              {!reactorOnline
                ? "Power up the reactor to begin."
                : `Hold above ${REACTOR_TARGET_POWER}% to unlock completion.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
