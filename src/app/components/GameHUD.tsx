"use client";

import { useEffect, useState } from "react";
import type { FeedbackEvent, MissionIndex } from "../lab-types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MISSION_OBJECTIVES: Record<MissionIndex, string> = {
  1: "INSPECT ALL 5 MACHINE COMPONENTS",
  2: "RESTORE REACTOR POWER TO 80%+",
  3: "SCAN SPECIMEN M-001 — FIND ALL ANOMALIES",
};

const MISSION_LABELS: Record<MissionIndex, string> = {
  1: "MISSION 01 / MACHINE INSPECTION",
  2: "MISSION 02 / REACTOR POWER",
  3: "MISSION 03 / MOTH INVESTIGATION",
};

function ScoreFlash({ feedback, onDone }: { feedback: FeedbackEvent; onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback.id]);

  const colorMap = {
    correct: "text-emerald-400 border-emerald-400/60 bg-emerald-400/15",
    wrong: "text-red-400 border-red-400/60 bg-red-400/15",
    info: "text-cyan-300 border-cyan-400/60 bg-cyan-400/15",
  };

  return (
    <div
      className={`pointer-events-none absolute right-4 top-20 z-50 transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
    >
      <div className={`border px-4 py-2 backdrop-blur-sm ${colorMap[feedback.type]}`}>
        <p className="text-right text-[10px] font-black tracking-[0.25em]">{feedback.message}</p>
        {feedback.points > 0 && (
          <p className="mt-0.5 text-right text-[11px] font-black tracking-widest text-yellow-300">
            +{feedback.points}
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  missionIndex: MissionIndex;
  missionProgress: number; // 0–1
  score: number;
  elapsedSeconds: number;
  feedback: FeedbackEvent | null;
  nearbyTarget: string | null;
  nearbyLabel: string;
  isPointerLocked: boolean;
  modalOpen: boolean;
  // completed missions for pip indicators
  mission1Done: boolean;
  mission2Done: boolean;
  mission3Done: boolean;
}

export default function GameHUD({
  missionIndex,
  missionProgress,
  score,
  elapsedSeconds,
  feedback,
  nearbyTarget,
  nearbyLabel,
  isPointerLocked,
  modalOpen,
  mission1Done,
  mission2Done,
  mission3Done,
}: Props) {
  const [displayedFeedback, setDisplayedFeedback] = useState<FeedbackEvent | null>(null);
  const [prevScore, setPrevScore] = useState(score);
  const [scoreFlash, setScoreFlash] = useState(false);

  useEffect(() => {
    if (feedback) setDisplayedFeedback(feedback);
  }, [feedback]);

  useEffect(() => {
    if (score > prevScore) {
      setScoreFlash(true);
      const t = setTimeout(() => setScoreFlash(false), 700);
      setPrevScore(score);
      return () => clearTimeout(t);
    }
    setPrevScore(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const donePips = [mission1Done, mission2Done, mission3Done];

  return (
    <>
      {/* ── Top-left: Mission info ── */}
      <div className="pointer-events-none absolute left-4 top-4 z-30 max-w-xs">
        <div className="border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md">
          <p className="text-[8px] tracking-[0.4em] text-gray-500">
            {MISSION_LABELS[missionIndex]}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-wider text-cyan-300">
            {MISSION_OBJECTIVES[missionIndex]}
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${missionProgress * 100}%` }}
            />
          </div>
          {/* Mission pips */}
          <div className="mt-2 flex items-center gap-2">
            {donePips.map((done, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={`h-1.5 w-5 rounded-full transition-all duration-500 ${
                    done ? "bg-cyan-400" : i + 1 === missionIndex ? "bg-cyan-400/40" : "bg-white/10"
                  }`}
                />
              </div>
            ))}
            <span className="ml-1 text-[8px] tracking-widest text-gray-600">
              {donePips.filter(Boolean).length}/3
            </span>
          </div>
        </div>
      </div>

      {/* ── Top-right: Score + Timer ── */}
      <div className="pointer-events-none absolute right-4 top-4 z-30">
        <div className="border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md text-right">
          <div className="flex items-baseline gap-3">
            <div>
              <p className="text-[7px] tracking-[0.35em] text-gray-500">SCORE</p>
              <p
                className={`text-lg font-black tabular-nums transition-colors duration-200 ${
                  scoreFlash ? "text-yellow-300" : "text-white"
                }`}
              >
                {score.toLocaleString()}
              </p>
            </div>
            <div className="w-px self-stretch bg-white/10" />
            <div>
              <p className="text-[7px] tracking-[0.35em] text-gray-500">TIME</p>
              <p className="text-lg font-black tabular-nums text-cyan-300">
                {formatTime(elapsedSeconds)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Score flash ── */}
      {displayedFeedback && (
        <ScoreFlash
          feedback={displayedFeedback}
          onDone={() => setDisplayedFeedback(null)}
        />
      )}

      {/* ── Centre crosshair (only when pointer locked and no modal) ── */}
      {isPointerLocked && !modalOpen && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="relative h-5 w-5">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/70" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/70" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/80" />
          </div>
        </div>
      )}

      {/* ── Bottom-centre: Interaction prompt ── */}
      {nearbyTarget && !modalOpen && (
        <div className="pointer-events-none absolute bottom-12 left-1/2 z-30 -translate-x-1/2">
          <div className="border border-cyan-400/50 bg-black/75 px-5 py-2.5 backdrop-blur-md">
            <p className="text-center text-[10px] font-black tracking-[0.3em] text-cyan-300">
              <span className="mr-2 rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-white">
                E
              </span>
              {nearbyLabel}
            </p>
          </div>
        </div>
      )}

      {/* ── Bottom-left: Controls hint (shown until first pointer lock) ── */}
      {!isPointerLocked && !modalOpen && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-30">
          <div className="border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
            <p className="text-[8px] tracking-widest text-gray-500">
              CLICK SCREEN TO LOCK MOUSE · WASD MOVE · E INTERACT · ESC UNLOCK
            </p>
          </div>
        </div>
      )}
    </>
  );
}
