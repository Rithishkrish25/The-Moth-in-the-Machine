"use client";

import { SCAN_READINGS } from "../lab-data";

interface Props {
  scanStarted: boolean;
  scanProgress: number;
  mothDiscovered: boolean;
  isComplete: boolean;
  onStartScan: () => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function Exp03Moth({
  scanStarted,
  scanProgress,
  mothDiscovered,
  isComplete,
  onStartScan,
  onComplete,
  onBack,
}: Props) {
  const scanDone = scanProgress >= 100;
  // How many readings are "visible" based on progress
  const visibleReadings = Math.floor((scanProgress / 100) * SCAN_READINGS.length);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-8">
      <button onClick={onBack} className="mb-4 self-start text-[9px] tracking-widest text-gray-500 transition hover:text-cyan-400">
        ← BACK TO DASHBOARD
      </button>

      <div className="mb-1 flex items-center gap-2">
        <span className="border border-violet-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-violet-400">EXP-03</span>
        <span className="text-[9px] tracking-widest text-gray-600">MOTH INVESTIGATION</span>
      </div>

      <h2 className="mt-1 text-xl font-black tracking-wider md:text-2xl">SPECIMEN SCAN</h2>

      <p className="mt-2 text-[11px] leading-5 text-gray-400">
        Initiate a full bio-mechanical scan of Specimen M-001 inside the containment chamber.
        Navigate to Level 03 and click the moth to interact with it, then run the scan sequence.
      </p>

      {/* Moth interaction prompt */}
      {!mothDiscovered && (
        <div className="my-4 border border-violet-400/20 bg-violet-400/5 p-4">
          <p className="text-[9px] tracking-[0.35em] text-violet-400">ACTION REQUIRED</p>
          <p className="mt-1.5 text-[11px] leading-4 text-gray-300">
            Navigate to Level 03 using the level controls, then click the moth specimen
            in the 3D view to establish contact before running the scan.
          </p>
        </div>
      )}

      {mothDiscovered && (
        <div className="my-4 border border-emerald-400/20 bg-emerald-400/5 p-3">
          <p className="text-[9px] tracking-[0.3em] text-emerald-400">✓ SPECIMEN CONTACT ESTABLISHED</p>
          <p className="mt-1 text-[10px] text-gray-400">Bio-signature detected. Ready to scan.</p>
        </div>
      )}

      {/* Scan control */}
      <div className="mb-4 border border-white/10 bg-black/30 p-4">
        <p className="mb-3 text-[9px] tracking-[0.35em] text-gray-500">BIO-SCAN SEQUENCE</p>

        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className={`text-2xl font-black ${scanDone ? "text-violet-400" : scanStarted ? "text-cyan-300" : "text-gray-600"}`}>
              {scanProgress.toFixed(0)}%
            </p>
            <p className="text-[9px] tracking-widest text-gray-500">SCAN PROGRESS (SIMULATED)</p>
          </div>

          {!scanStarted && (
            <button
              onClick={onStartScan}
              disabled={!mothDiscovered}
              className={`border px-5 py-3 text-[10px] font-bold tracking-[0.25em] transition-all duration-300 ${
                mothDiscovered
                  ? "border-violet-400/60 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20"
                  : "cursor-not-allowed border-white/10 text-gray-600"
              }`}
            >
              INITIATE SCAN
            </button>
          )}

          {scanStarted && !scanDone && (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-violet-400" />
              <span className="text-[9px] tracking-widest text-violet-400">SCANNING…</span>
            </div>
          )}
          {scanDone && (
            <span className="text-[9px] font-bold tracking-widest text-violet-400">SCAN COMPLETE</span>
          )}
        </div>

        <div className="h-2 w-full overflow-hidden bg-white/10">
          <div
            className="h-full bg-violet-400 transition-all duration-300"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
      </div>

      {/* Readings revealed progressively */}
      {scanStarted && visibleReadings > 0 && (
        <>
          <p className="mb-2 text-[9px] tracking-[0.35em] text-gray-500">SCAN FINDINGS (SIMULATED)</p>
          <div className="space-y-2">
            {SCAN_READINGS.slice(0, visibleReadings).map((r) => (
              <div
                key={r.label}
                className={`border p-3 ${
                  r.anomaly
                    ? "border-red-400/30 bg-red-400/5"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] text-gray-400">{r.label}</p>
                  <p className={`text-right text-[10px] font-bold ${r.anomaly ? "text-red-400" : "text-emerald-400"}`}>
                    {r.value}
                  </p>
                </div>
                {r.anomaly && (
                  <p className="mt-1 text-[9px] tracking-widest text-red-400/70">⚠ ANOMALY DETECTED</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Observation summary */}
      {scanDone && (
        <div className="mt-4 border border-red-400/20 bg-red-400/5 p-4">
          <p className="text-[9px] tracking-[0.3em] text-red-400">OBSERVATION SUMMARY</p>
          <p className="mt-2 text-[11px] leading-5 text-gray-300">
            Specimen M-001 exhibits anomalous energy absorption and uncharacterised neural activity.
            Bio-mechanical integration exceeds all known parameters. Classification: Unknown Organism.
            Further containment review recommended.
          </p>
        </div>
      )}

      {/* Complete */}
      <div className="mt-6">
        {isComplete ? (
          <div className="border border-emerald-400/30 bg-emerald-400/5 p-3 text-center">
            <p className="text-[10px] font-bold tracking-widest text-emerald-400">✓ EXPERIMENT COMPLETE</p>
          </div>
        ) : scanDone ? (
          <button
            onClick={onComplete}
            className="w-full border border-violet-400 bg-violet-400/10 py-4 text-[10px] font-bold tracking-[0.3em] text-violet-300 transition hover:bg-violet-400/20"
          >
            SUBMIT FINDINGS → COMPLETE EXP-03
          </button>
        ) : (
          <div className="border border-white/10 p-3 text-center">
            <p className="text-[10px] text-gray-500">
              {!mothDiscovered
                ? "Click the moth in the 3D view first."
                : !scanStarted
                ? "Initiate the scan to begin analysis."
                : "Scan in progress — please wait."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
