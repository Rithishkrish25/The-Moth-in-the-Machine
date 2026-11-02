"use client";

import type { InspectionItem } from "../lab-types";
import { INSPECTION_POINTS } from "../lab-data";

const STATUS_STYLE: Record<InspectionItem["status"], string> = {
  NOMINAL:  "text-emerald-400 border-emerald-400/30",
  ELEVATED: "text-amber-400  border-amber-400/30",
  CRITICAL: "text-red-400    border-red-400/30",
};

const STATUS_HINT: Record<InspectionItem["status"], string> = {
  NOMINAL:  "System nominal — standard inspection required.",
  ELEVATED: "Elevated status — flag for follow-up monitoring.",
  CRITICAL: "CRITICAL — document immediately.",
};

interface Props {
  items: InspectionItem[];
  // Called by parent; deduplication is handled upstream (scoredActions)
  onToggle: (id: string) => void;
  onComplete: () => void;
  onBack: () => void;
  // Which item id is currently "active" (just clicked, highlighted)
  activeItemId: string | null;
}

export default function Exp01Inspection({
  items,
  onToggle,
  onComplete,
  onBack,
  activeItemId,
}: Props) {
  const checkedCount = items.filter((i) => i.checked).length;
  const allDone = checkedCount === items.length;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <button
        onClick={onBack}
        className="mb-3 self-start text-[9px] tracking-widest text-gray-500 transition hover:text-cyan-400"
      >
        ← BACK
      </button>

      <div className="mb-1 flex items-center gap-2">
        <span className="border border-cyan-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-cyan-400">EXP-01</span>
        <span className="text-[9px] tracking-widest text-gray-600">MACHINE INSPECTION</span>
      </div>

      <h2 className="mt-1 text-lg font-black tracking-wider md:text-xl">COMPONENT INSPECTION</h2>

      {/* Objective */}
      <div className="mt-2 border-l-2 border-cyan-400/60 bg-cyan-400/5 px-3 py-2">
        <p className="text-[9px] tracking-[0.3em] text-cyan-400">OBJECTIVE</p>
        <p className="mt-0.5 text-[11px] text-gray-300">
          Click each component in the list <strong className="text-white">or</strong> click
          them directly in the 3D laboratory. Inspect all 5 to complete Level 1.
        </p>
      </div>

      {/* Progress */}
      <div className="my-3">
        <div className="mb-1 flex justify-between">
          <p className="text-[9px] tracking-widest text-gray-500">INSPECTION PROGRESS</p>
          <p className="text-[9px] font-bold text-cyan-300">{checkedCount} / {items.length}</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Hint */}
      {checkedCount === 0 && (
        <div className="mb-3 border border-amber-400/20 bg-amber-400/5 p-2">
          <p className="text-[9px] text-amber-400">
            💡 HINT: Navigate the 3D view — click the glowing beacons, columns, and containment ring.
          </p>
        </div>
      )}

      {/* Active item expanded detail */}
      {activeItemId && (() => {
        const item = items.find((i) => i.id === activeItemId);
        if (!item) return null;
        return (
          <div className="mb-3 border border-cyan-400/30 bg-cyan-400/5 p-3">
            <p className="text-[9px] tracking-[0.3em] text-cyan-400">SELECTED COMPONENT</p>
            <p className="mt-1 text-sm font-black text-white">{item.component}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">{item.location}</p>
            <p className="mt-1 text-[10px] leading-4 text-gray-300">{item.function}</p>
            <p className={`mt-1.5 text-[9px] font-bold ${STATUS_STYLE[item.status].split(" ")[0]}`}>
              STATUS: {item.status} — {STATUS_HINT[item.status]}
            </p>
            {!item.checked && (
              <button
                onClick={() => onToggle(item.id)}
                className="mt-2 w-full border border-cyan-400/60 bg-cyan-400/10 py-2 text-[9px] font-bold tracking-[0.25em] text-cyan-300 transition hover:bg-cyan-400/20"
              >
                MARK AS INSPECTED (+{INSPECTION_POINTS[item.id]} PTS)
              </button>
            )}
            {item.checked && (
              <p className="mt-2 text-center text-[9px] font-bold tracking-widest text-emerald-400">✓ INSPECTED</p>
            )}
          </div>
        );
      })()}

      {/* Checklist */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`w-full border p-3 text-left transition-all duration-200 ${
              item.checked
                ? "border-emerald-400/30 bg-emerald-400/5"
                : activeItemId === item.id
                ? "border-cyan-400/60 bg-cyan-400/10"
                : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-all ${
                  item.checked
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {item.checked && <span className="text-[10px] leading-none">✓</span>}
              </div>

              {/* Name + status */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold tracking-wide text-white">{item.component}</p>
                  <span className={`border px-1.5 py-0.5 text-[8px] tracking-widest ${STATUS_STYLE[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-500">{item.location}</p>
              </div>

              {/* Points badge */}
              <div className="shrink-0 text-right">
                {item.checked ? (
                  <span className="text-[9px] font-bold text-emerald-400">✓</span>
                ) : (
                  <span className="text-[9px] text-gray-600">+{INSPECTION_POINTS[item.id]}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Complete button */}
      <div className="mt-4">
        {allDone ? (
          <button
            onClick={onComplete}
            className="w-full border border-cyan-400 bg-cyan-400/10 py-4 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20 active:scale-95"
          >
            ✓ COMPLETE INSPECTION → UNLOCK EXP-02
          </button>
        ) : (
          <div className="border border-white/10 p-3 text-center">
            <p className="text-[10px] text-gray-500">
              {items.length - checkedCount} component{items.length - checkedCount !== 1 ? "s" : ""} remaining.
              Click them in the list or the 3D scene.
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-[8px] tracking-widest text-gray-600">
        * COMPONENT STATUS VALUES ARE SIMULATED
      </p>
    </div>
  );
}
