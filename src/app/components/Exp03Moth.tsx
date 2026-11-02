"use client";

import { SCAN_READINGS, SCAN_ANOMALY_POINTS, MOTH_CONTACT_POINTS, SCAN_COMPLETE_POINTS } from "../lab-data";

interface Props {
  scanStarted: boolean;
  scanProgress: number;
  mothDiscovered: boolean;
  isComplete: boolean;
  onStartScan: () => void;
  onComplete: () => void;
  onBack: () => void;
  // Scoring callbacks (parent deduplicates via scoredActions)
  onMothContact: () => void;
  mothContactScored: boolean;
  onScanComplete: () => void;
  scanCompleteScored: boolean;
  // Count of anomaly discoveries already scored
  anomaliesScored: number;
  onAnomalyDiscovered: (idx: number) => void;
}

export default function Exp03Moth({
  scanStarted,
  scanProgress,
  mothDiscovered,
  isComplete,
  onStartScan,
  onComplete,
  onBack,
  onMothContact,
  mothContactScored,
  onScanComplete,
  scanCompleteScored,
  anomaliesScored,
  onAnomalyDiscovered,
}: Props) {
  const scanDone = scanProgress >= 100;
  const visibleReadings = Math.floor((scanProgress / 100) * SCAN_READINGS.length);

  // Count anomalies among visible readings
  const visibleAnomalies = SCAN_READINGS.slice(0, visibleReadings).filter((r) => r.anomaly);
  const totalAnomalies = SCAN_READINGS.filter((r) => r.anomaly).length;

  // Fire anomaly score events as they become visible
  // We track them by their index in SCAN_READINGS
  const allAnomalyIndexes = SCAN_READINGS
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.anomaly)
    .map(({ i }) => i);

  // Which anomaly indexes are now visible
  const visibleAnomalyIndexes = allAnomalyIndexes.filter((i) => i < visibleReadings);

  // Trigger score for newly revealed anomalies
  visibleAnomalyIndexes.forEach((idx, slot) => {
    if (slot >= anomaliesScored) {
      onAnomalyDiscovered(slot);
    }
  });

  // Trigger scan-complete score
  if (scanDone && !scanCompleteScored) {
    onScanComplete();
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
      <button onClick={onBack} className="mb-3 self-start text-[9px] tracking-widest text-gray-500 transition hover:text-cyan-400">
        ← BACK
      </button>

      <div className="mb-1 flex items-center gap-2">
        <span className="border border-violet-400/40 px-2 py-0.5 text-[9px] tracking-[0.3em] text-violet-400">EXP-03</span>
        <span className="text-[9px] tracking-widest text-gray-600">MOTH INVESTIGATION</span>
      </div>

      <h2 className="mt-1 text-lg font-black tracking-wider md:text-xl">SPECIMEN SCAN</h2>

      {/* Objective */}
      <div className="mt-2 border-l-2 border-violet-400/60 bg-violet-400/5 px-3 py-2">
        <p className="text-[9px] tracking-[0.3em] text-violet-400">OBJECTIVE</p>
        <p className="mt-0.5 text-[11px] text-gray-300">
          Navigate to <strong className="text-white">Level 03</strong> and click the moth
          to establish contact. Then initiate the bio-scan and identify all anomalies.
          Each anomaly discovered earns <strong className="text-yellow-300">+{SCAN_ANOMALY_POINTS} pts</strong>.
        </p>
      </div>

      {/* Clue counter */}
      <div className="my-3 flex items-center gap-3 border border-white/10 bg-black/20 px-3 py-2">
        <div className="flex gap-1">
          {Array.from({ length: totalAnomalies }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full border transition-all duration-300 ${
                i < visibleAnomalies.length
                  ? "border-red-400 bg-red-400"
                  : "border-white/20 bg-transparent"
              }`}
            />
          ))}
        </div>
        <p className="text-[9px] tracking-widest text-gray-400">
          ANOMALIES DETECTED: {visibleAnomalies.length} / {totalAnomalies}
        </p>
      </div>

      {/* Moth interaction prompt */}
      {!mothDiscovered && (
        <div className="my-3 border border-violet-400/20 bg-violet-400/5 p-3">
          <p className="text-[9px] tracking-[0.35em] text-violet-400">ACTION REQUIRED</p>
          <p className="mt-1.5 text-[11px] leading-4 text-gray-300">
            Navigate to <strong className="text-white">Level 03</strong> using the level
            controls, then <strong className="text-white">click the moth</strong> in the 3D
            view to establish contact.
          </p>
          <p className="mt-1.5 text-[9px] text-amber-400">
            💡 HINT: Press button &quot;3&quot; or click MOTH CORE below the 3D scene.
          </p>
        </div>
      )}

      {mothDiscovered && !mothContactScored && null /* score already fired from parent */}

      {mothDiscovered && (
        <div className="my-3 border border-emerald-400/20 bg-emerald-400/5 p-2.5">
          <p className="text-[9px] tracking-[0.3em] text-emerald-400">
            ✓ SPECIMEN CONTACT ESTABLISHED (+{MOTH_CONTACT_POINTS} PTS)
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">Bio-signature detected. Ready to scan.</p>
        </div>
      )}

      {/* Scan control */}
      <div className="mb-3 border border-white/10 bg-black/30 p-4">
        <p className="mb-2 text-[9px] tracking-[0.35em] text-gray-500">BIO-SCAN SEQUENCE (SIMULATED)</p>

        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className={`text-2xl font-black tabular-nums ${scanDone ? "text-violet-400" : scanStarted ? "text-cyan-300" : "text-gray-600"}`}>
              {scanProgress.toFixed(0)}%
            </p>
            <p className="text-[9px] tracking-widest text-gray-500">SCAN PROGRESS</p>
          </div>

          {!scanStarted && (
            <button
              onClick={() => {
                onMothContact(); // ensure contact is scored before scan starts
                onStartScan();
              }}
              disabled={!mothDiscovered}
              className={`border px-4 py-2.5 text-[10px] font-bold tracking-[0.25em] transition-all duration-300 active:scale-95 ${
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

      {/* Scan complete bonus */}
      {scanCompleteScored && (
        <div className="mb-3 border border-yellow-400/30 bg-yellow-400/5 p-2 text-center">
          <p className="text-[9px] font-bold tracking-widest text-yellow-300">
            ⭐ +{SCAN_COMPLETE_POINTS} PTS — FULL SCAN BONUS
          </p>
        </div>
      )}

      {/* Readings revealed progressively */}
      {scanStarted && visibleReadings > 0 && (
        <>
          <p className="mb-2 text-[9px] tracking-[0.35em] text-gray-500">SCAN FINDINGS (SIMULATED)</p>
          <div className="space-y-1.5">
            {SCAN_READINGS.slice(0, visibleReadings).map((r) => (
              <div
                key={r.label}
                className={`border p-2.5 ${
                  r.anomaly ? "border-red-400/30 bg-red-400/5" : "border-white/10 bg-black/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] text-gray-400">{r.label}</p>
                  <p className={`text-right text-[10px] font-bold ${r.anomaly ? "text-red-400" : "text-emerald-400"}`}>
                    {r.value}
                  </p>
                </div>
                {r.anomaly && (
                  <p className="mt-0.5 text-[8px] tracking-widest text-red-400/80">
                    ⚠ ANOMALY DETECTED — +{SCAN_ANOMALY_POINTS} PTS
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Observation summary */}
      {scanDone && (
        <div className="mt-3 border border-red-400/20 bg-red-400/5 p-3">
          <p className="text-[9px] tracking-[0.3em] text-red-400">OBSERVATION SUMMARY</p>
          <p className="mt-2 text-[11px] leading-5 text-gray-300">
            Specimen M-001 exhibits anomalous energy absorption and uncharacterised neural
            activity. Bio-mechanical integration exceeds all known parameters. Classification:
            Unknown Organism. Further containment review recommended.
          </p>
        </div>
      )}

      {/* Complete */}
      <div className="mt-4">
        {isComplete ? (
          <div className="border border-emerald-400/30 bg-emerald-400/5 p-3 text-center">
            <p className="text-[10px] font-bold tracking-widest text-emerald-400">✓ EXPERIMENT COMPLETE</p>
          </div>
        ) : scanDone ? (
          <button
            onClick={onComplete}
            className="w-full border border-violet-400 bg-violet-400/10 py-4 text-[10px] font-bold tracking-[0.3em] text-violet-300 transition hover:bg-violet-400/20 active:scale-95"
          >
            ✓ SUBMIT FINDINGS → COMPLETE EXP-03
          </button>
        ) : (
          <div className="border border-white/10 p-3 text-center">
            <p className="text-[10px] text-gray-500">
              {!mothDiscovered
                ? "Click the moth in Level 03 first."
                : !scanStarted
                ? "Initiate the scan to begin analysis."
                : "Scan in progress — stand by."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
