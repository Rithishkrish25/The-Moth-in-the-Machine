"use client";

import { useEffect, useState } from "react";
import type { InspectionItem, MissionIndex } from "../lab-types";
import {
  INSPECTION_ITEMS,
  INSPECTION_POINTS,
  ENERGY_READINGS,
  REACTOR_TARGET_POWER,
  REACTOR_BONUS_POINTS,
  SCAN_READINGS,
  SCAN_ANOMALY_POINTS,
  MOTH_CONTACT_POINTS,
  SCAN_COMPLETE_POINTS,
} from "../lab-data";

// ── Status colours ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<InspectionItem["status"], string> = {
  NOMINAL:  "text-emerald-400 border-emerald-400/30",
  ELEVATED: "text-amber-400  border-amber-400/30",
  CRITICAL: "text-red-400    border-red-400/30",
};

const ENERGY_STATUS_STYLE = {
  NOMINAL:  "text-emerald-400",
  ELEVATED: "text-amber-400",
  WARNING:  "text-red-400",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function missionItemIdForTarget(targetId: string): string | null {
  // Maps interactable IDs to inspection item IDs (they happen to match)
  const ids = INSPECTION_ITEMS.map((i) => i.id);
  return ids.includes(targetId) ? targetId : null;
}

// ── Mission 1: Inspection modal ───────────────────────────────────────────────
function InspectionModal({
  itemId,
  inspectionItems,
  onToggle,
  onClose,
}: {
  itemId: string;
  inspectionItems: InspectionItem[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const item = inspectionItems.find((i) => i.id === itemId);
  if (!item) return null;

  const checkedCount = inspectionItems.filter((i) => i.checked).length;

  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="border border-cyan-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-cyan-400">
          EXP-01 / MACHINE INSPECTION
        </span>
        <span className="text-[9px] text-gray-500">{checkedCount}/5 INSPECTED</span>
      </div>

      <div className="border border-white/10 bg-black/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black tracking-wide text-white">{item.component}</p>
            <p className="mt-0.5 text-[10px] text-gray-500">{item.location}</p>
          </div>
          <span className={`border px-2 py-0.5 text-[8px] tracking-widest ${STATUS_STYLE[item.status]}`}>
            {item.status}
          </span>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-gray-300">{item.function}</p>
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[9px] text-gray-500">STATUS NOTE (SIMULATED)</p>
          <p className="mt-1 text-[10px] text-gray-400">
            {item.status === "NOMINAL" && "Operating within normal parameters. No immediate action required."}
            {item.status === "ELEVATED" && "Output above baseline. Monitor closely — flag for follow-up."}
            {item.status === "CRITICAL" && "Critical condition detected. Document immediately and secure area."}
          </p>
        </div>
      </div>

      {item.checked ? (
        <div className="mt-3 border border-emerald-400/30 bg-emerald-400/5 p-3 text-center">
          <p className="text-[10px] font-bold tracking-widest text-emerald-400">✓ ALREADY INSPECTED</p>
        </div>
      ) : (
        <button
          onClick={() => { onToggle(itemId); onClose(); }}
          className="mt-3 w-full border border-cyan-400 bg-cyan-400/10 py-3 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20 active:scale-95"
        >
          MARK AS INSPECTED  +{INSPECTION_POINTS[itemId] ?? 100} PTS
        </button>
      )}

      {/* Progress dots */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {inspectionItems.map((it) => (
          <div
            key={it.id}
            className={`h-2 w-2 rounded-full border transition-all duration-300 ${
              it.checked ? "border-emerald-400 bg-emerald-400" : "border-white/20 bg-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Mission 2: Reactor control modal ─────────────────────────────────────────
function ReactorModal({
  reactorOnline,
  reactorPower,
  onToggleReactor,
  onComplete,
  isComplete,
  targetReachedScored,
  onTargetReached,
}: {
  reactorOnline: boolean;
  reactorPower: number;
  onToggleReactor: () => void;
  onComplete: () => void;
  isComplete: boolean;
  targetReachedScored: boolean;
  onTargetReached: () => void;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!reactorOnline) return;
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, [reactorOnline]);

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

  let statusMsg = "";
  let statusCls = "";
  if (reactorOnline) {
    if (reactorPower >= REACTOR_TARGET_POWER) {
      statusMsg = "✓ TARGET REACHED — STABLE OUTPUT";
      statusCls = "text-emerald-400 border-emerald-400/30 bg-emerald-400/5";
    } else if (reactorPower >= REACTOR_TARGET_POWER * 0.6) {
      statusMsg = "↑ APPROACHING TARGET — HOLD STEADY";
      statusCls = "text-amber-400 border-amber-400/30 bg-amber-400/5";
    } else {
      statusMsg = "⚡ OUTPUT TOO LOW — MAINTAIN POWER";
      statusCls = "text-red-400 border-red-400/30 bg-red-400/5";
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="border border-cyan-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-cyan-400">
          EXP-02 / REACTOR CONTROL
        </span>
        <span className="text-[9px] text-amber-400/70">TARGET: {REACTOR_TARGET_POWER}%</span>
      </div>

      {/* Power display + button */}
      <div className="border border-white/10 bg-black/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-3xl font-black tabular-nums ${reactorOnline ? (reactorPower >= REACTOR_TARGET_POWER ? "text-emerald-400" : "text-cyan-300") : "text-gray-600"}`}>
              {reactorOnline ? `${reactorPower.toFixed(1)}%` : "OFFLINE"}
            </p>
            <p className="mt-0.5 text-[8px] tracking-widest text-gray-500">POWER OUTPUT (SIMULATED)</p>
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

        {/* Bar */}
        <div className="relative mt-3">
          <div className="h-3 w-full overflow-hidden bg-white/10">
            <div
              className={`h-full transition-all duration-500 ${
                reactorPower >= REACTOR_TARGET_POWER ? "bg-emerald-400" : reactorOnline ? "bg-cyan-400" : "bg-white/10"
              }`}
              style={{ width: `${reactorOnline ? reactorPower : 0}%` }}
            />
          </div>
          <div className="absolute top-0 h-3 w-0.5 bg-amber-400" style={{ left: `${REACTOR_TARGET_POWER}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[7px] text-gray-600">
          <span>0%</span><span className="text-amber-400/70">{REACTOR_TARGET_POWER}% TARGET</span><span>100%</span>
        </div>
      </div>

      {statusMsg && (
        <div className={`mt-2 border p-2 text-center ${statusCls}`}>
          <p className="text-[9px] font-bold tracking-[0.2em]">{statusMsg}</p>
        </div>
      )}

      {targetReachedScored && (
        <div className="mt-2 border border-yellow-400/30 bg-yellow-400/5 p-1.5 text-center">
          <p className="text-[8px] font-bold tracking-widest text-yellow-300">
            ⭐ +{REACTOR_BONUS_POINTS} PTS BONUS AWARDED
          </p>
        </div>
      )}

      {/* Compact live readings */}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {ENERGY_READINGS.map((r, i) => (
          <div key={r.label} className="border border-white/10 bg-black/20 p-2">
            <p className="text-[7px] tracking-widest text-gray-500">{r.label}</p>
            <p className={`mt-0.5 text-[11px] font-black ${reactorOnline ? ENERGY_STATUS_STYLE[r.status] : "text-gray-700"}`}>
              {simValue(r.value, i)}<span className="text-[7px] opacity-60"> {r.unit}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[7px] text-gray-600">* All readings simulated</p>

      {isComplete ? (
        <div className="mt-3 border border-emerald-400/30 bg-emerald-400/5 p-3 text-center">
          <p className="text-[10px] font-bold tracking-widest text-emerald-400">✓ MISSION COMPLETE</p>
        </div>
      ) : canComplete ? (
        <button
          onClick={onComplete}
          className="mt-3 w-full border border-cyan-400 bg-cyan-400/10 py-3 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20 active:scale-95"
        >
          ✓ VERIFY READINGS → COMPLETE MISSION 02
        </button>
      ) : (
        <div className="mt-3 border border-white/10 p-2.5 text-center">
          <p className="text-[9px] text-gray-500">
            {!reactorOnline ? "Press POWER UP to start the reactor." : `Hold above ${REACTOR_TARGET_POWER}% to unlock.`}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Mission 3: Moth scanner modal ─────────────────────────────────────────────
function MothScanModal({
  mothDiscovered,
  scanStarted,
  scanProgress,
  isComplete,
  onStartScan,
  onComplete,
  mothContactScored,
  scanCompleteScored,
  anomaliesScored,
  onMothContact,
  onScanComplete,
  onAnomalyDiscovered,
}: {
  mothDiscovered: boolean;
  scanStarted: boolean;
  scanProgress: number;
  isComplete: boolean;
  onStartScan: () => void;
  onComplete: () => void;
  mothContactScored: boolean;
  scanCompleteScored: boolean;
  anomaliesScored: number;
  onMothContact: () => void;
  onScanComplete: () => void;
  onAnomalyDiscovered: (slot: number) => void;
}) {
  const scanDone = scanProgress >= 100;
  const visibleReadings = Math.floor((scanProgress / 100) * SCAN_READINGS.length);
  const visibleAnomalies = SCAN_READINGS.slice(0, visibleReadings).filter((r) => r.anomaly);
  const totalAnomalies = SCAN_READINGS.filter((r) => r.anomaly).length;

  const allAnomalyIndexes = SCAN_READINGS
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.anomaly)
    .map(({ i }) => i);
  const visibleAnomalyIndexes = allAnomalyIndexes.filter((i) => i < visibleReadings);
  visibleAnomalyIndexes.forEach((_, slot) => {
    if (slot >= anomaliesScored) onAnomalyDiscovered(slot);
  });
  if (scanDone && !scanCompleteScored) onScanComplete();

  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="border border-violet-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-violet-400">
          EXP-03 / SPECIMEN SCANNER
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalAnomalies }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full border ${
                i < visibleAnomalies.length ? "border-red-400 bg-red-400" : "border-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Contact status */}
      {!mothDiscovered ? (
        <div className="mb-3 border border-violet-400/20 bg-violet-400/5 p-3">
          <p className="text-[9px] tracking-[0.35em] text-violet-400">ACTION REQUIRED</p>
          <p className="mt-1.5 text-[11px] leading-4 text-gray-300">
            Approach the moth specimen and activate this terminal to establish bio-contact.
          </p>
          <button
            onClick={onMothContact}
            className="mt-2 w-full border border-violet-400/60 bg-violet-400/10 py-2 text-[9px] font-bold tracking-[0.25em] text-violet-300 transition hover:bg-violet-400/20"
          >
            ESTABLISH BIO-CONTACT  +{MOTH_CONTACT_POINTS} PTS
          </button>
        </div>
      ) : (
        <div className="mb-3 border border-emerald-400/20 bg-emerald-400/5 p-2">
          <p className="text-[9px] tracking-[0.3em] text-emerald-400">✓ BIO-CONTACT ESTABLISHED</p>
          <p className="mt-0.5 text-[9px] text-gray-400">Bio-signature detected. Specimen M-001 active.</p>
        </div>
      )}

      {/* Scan control */}
      <div className="border border-white/10 bg-black/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className={`text-2xl font-black tabular-nums ${scanDone ? "text-violet-400" : scanStarted ? "text-cyan-300" : "text-gray-600"}`}>
              {scanProgress.toFixed(0)}%
            </p>
            <p className="text-[8px] tracking-widest text-gray-500">SCAN PROGRESS (SIMULATED)</p>
          </div>
          {!scanStarted ? (
            <button
              onClick={() => { onMothContact(); onStartScan(); }}
              disabled={!mothDiscovered}
              className={`border px-4 py-2 text-[9px] font-bold tracking-[0.2em] transition active:scale-95 ${
                mothDiscovered
                  ? "border-violet-400/60 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20"
                  : "cursor-not-allowed border-white/10 text-gray-600"
              }`}
            >
              INITIATE SCAN
            </button>
          ) : !scanDone ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-violet-400" />
              <span className="text-[8px] tracking-widest text-violet-400">SCANNING…</span>
            </div>
          ) : (
            <span className="text-[8px] font-bold tracking-widest text-violet-400">COMPLETE</span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden bg-white/10">
          <div className="h-full bg-violet-400 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
        </div>
      </div>

      {/* Findings */}
      {scanStarted && visibleReadings > 0 && (
        <div className="mt-2 space-y-1">
          {SCAN_READINGS.slice(0, visibleReadings).map((r) => (
            <div
              key={r.label}
              className={`flex items-center justify-between border px-2.5 py-1.5 text-[9px] ${
                r.anomaly ? "border-red-400/30 bg-red-400/5" : "border-white/10 bg-black/20"
              }`}
            >
              <span className="text-gray-400">{r.label}</span>
              <span className={`font-bold ${r.anomaly ? "text-red-400" : "text-emerald-400"}`}>
                {r.anomaly ? `⚠ ${r.value}` : r.value}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-1 text-[7px] text-gray-600">* All scan readings simulated</p>

      {scanCompleteScored && (
        <div className="mt-2 border border-yellow-400/30 bg-yellow-400/5 p-1.5 text-center">
          <p className="text-[8px] font-bold tracking-widest text-yellow-300">
            ⭐ +{SCAN_COMPLETE_POINTS} PTS — FULL SCAN BONUS
          </p>
        </div>
      )}

      {isComplete ? (
        <div className="mt-3 border border-emerald-400/30 bg-emerald-400/5 p-3 text-center">
          <p className="text-[10px] font-bold tracking-widest text-emerald-400">✓ MISSION COMPLETE</p>
        </div>
      ) : scanDone ? (
        <button
          onClick={onComplete}
          className="mt-3 w-full border border-violet-400 bg-violet-400/10 py-3 text-[10px] font-bold tracking-[0.3em] text-violet-300 transition hover:bg-violet-400/20 active:scale-95"
        >
          ✓ SUBMIT FINDINGS → COMPLETE MISSION 03
        </button>
      ) : (
        <div className="mt-3 border border-white/10 p-2.5 text-center">
          <p className="text-[9px] text-gray-500">
            {!mothDiscovered ? "Establish bio-contact first." : !scanStarted ? "Initiate the scan." : "Scanning — please wait."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main MissionModal wrapper ─────────────────────────────────────────────────
interface MissionModalProps {
  targetId: string;
  missionIndex: MissionIndex;
  // Mission 1
  inspectionItems: InspectionItem[];
  onToggleInspection: (id: string) => void;
  // Mission 2
  reactorOnline: boolean;
  reactorPower: number;
  onToggleReactor: () => void;
  onCompleteReactor: () => void;
  reactorComplete: boolean;
  reactorTargetReachedScored: boolean;
  onReactorTargetReached: () => void;
  // Mission 3
  mothDiscovered: boolean;
  scanStarted: boolean;
  scanProgress: number;
  onStartScan: () => void;
  onCompleteScan: () => void;
  scanComplete: boolean;
  mothContactScored: boolean;
  scanCompleteScored: boolean;
  anomaliesScored: number;
  onMothContact: () => void;
  onScanCompleteScored: () => void;
  onAnomalyDiscovered: (slot: number) => void;
  // Common
  onClose: () => void;
}

export default function MissionModal({
  targetId,
  missionIndex,
  inspectionItems,
  onToggleInspection,
  reactorOnline,
  reactorPower,
  onToggleReactor,
  onCompleteReactor,
  reactorComplete,
  reactorTargetReachedScored,
  onReactorTargetReached,
  mothDiscovered,
  scanStarted,
  scanProgress,
  onStartScan,
  onCompleteScan,
  scanComplete,
  mothContactScored,
  scanCompleteScored,
  anomaliesScored,
  onMothContact,
  onScanCompleteScored,
  onAnomalyDiscovered,
  onClose,
}: MissionModalProps) {
  // Determine which sub-modal to render
  const inspectionItemId = missionItemIdForTarget(targetId);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center border border-white/20 bg-[#050914] text-lg text-gray-400 transition hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        {/* Modal content */}
        <div className="overflow-y-auto border border-white/10 bg-[#071321]/95 p-5 shadow-[0_0_60px_rgba(34,211,238,0.1)] [max-height:80vh]">
          {missionIndex === 1 && inspectionItemId && (
            <InspectionModal
              itemId={inspectionItemId}
              inspectionItems={inspectionItems}
              onToggle={onToggleInspection}
              onClose={onClose}
            />
          )}
          {missionIndex === 2 && targetId === "reactor-panel" && (
            <ReactorModal
              reactorOnline={reactorOnline}
              reactorPower={reactorPower}
              onToggleReactor={onToggleReactor}
              onComplete={onCompleteReactor}
              isComplete={reactorComplete}
              targetReachedScored={reactorTargetReachedScored}
              onTargetReached={onReactorTargetReached}
            />
          )}
          {missionIndex === 3 && targetId === "moth-scanner" && (
            <MothScanModal
              mothDiscovered={mothDiscovered}
              scanStarted={scanStarted}
              scanProgress={scanProgress}
              isComplete={scanComplete}
              onStartScan={onStartScan}
              onComplete={onCompleteScan}
              mothContactScored={mothContactScored}
              scanCompleteScored={scanCompleteScored}
              anomaliesScored={anomaliesScored}
              onMothContact={onMothContact}
              onScanComplete={onScanCompleteScored}
              onAnomalyDiscovered={onAnomalyDiscovered}
            />
          )}

          {/* ESC hint */}
          <p className="mt-4 text-center text-[8px] tracking-[0.3em] text-gray-600">
            PRESS ESC TO CLOSE · RETURN TO FACILITY
          </p>
        </div>
      </div>
    </div>
  );
}
