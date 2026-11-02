"use client";

import type { InspectionItem } from "../lab-types";

const STATUS_STYLE: Record<InspectionItem["status"], string> = {
  NOMINAL: "text-emerald-400 border-emerald-400/30",
  ELEVATED: "text-amber-400 border-amber-400/30",
  CRITICAL: "text-red-400 border-red-400/30",
};

interface Props {
  items: InspectionItem[];
  onToggle: (id: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function Exp01Inspection({ items, onToggle, onComplete, onBack }: Props) {
  const checkedCount = items.filter((i) => i.checked).length;
  const allDone = checkedCount === items.length;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-8">
      {/* Header */}
      <button onClick={onBack} className="mb-4 self-start text-[9px] tracking-widest text-gray-500 transition hover:text-cyan-400">
        ← BACK TO DASHBOARD
      </button>

      <div className="mb-1 flex items-center gap-2">
        <span className="border border-cyan-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-cyan-400">EXP-01</span>
        <span className="text-[9px] tracking-widest text-gray-600">MACHINE INSPECTION</span>
      </div>

      <h2 className="mt-1 text-xl font-black tracking-wider md:text-2xl">COMPONENT INSPECTION</h2>

      <p className="mt-2 text-[11px] leading-5 text-gray-400">
        Inspect each critical machine component below. Navigate the 3D laboratory to locate
        each component, then mark it as inspected. All status readings are simulated.
      </p>

      {/* Progress */}
      <div className="my-4">
        <div className="mb-1 flex justify-between">
          <p className="text-[9px] tracking-widest text-gray-500">INSPECTION PROGRESS</p>
          <p className="text-[9px] font-bold text-cyan-300">{checkedCount}/{items.length}</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`w-full border p-3 text-left transition-all duration-200 ${
              item.checked
                ? "border-emerald-400/30 bg-emerald-400/5"
                : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-all ${
                  item.checked
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {item.checked && <span className="text-[10px] leading-none">✓</span>}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold tracking-wide text-white">{item.component}</p>
                  <span className={`border px-1.5 py-0.5 text-[8px] tracking-widest ${STATUS_STYLE[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-500">{item.location}</p>
                <p className="mt-1 text-[10px] leading-4 text-gray-400">{item.function}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Complete button */}
      <div className="mt-6">
        {allDone ? (
          <button
            onClick={onComplete}
            className="w-full border border-cyan-400 bg-cyan-400/10 py-4 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20"
          >
            COMPLETE INSPECTION → PROCEED TO EXP-02
          </button>
        ) : (
          <div className="border border-white/10 p-3 text-center">
            <p className="text-[10px] text-gray-500">
              Mark all {items.length} components to complete this experiment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
