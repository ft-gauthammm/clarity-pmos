"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, Zap, RotateCcw, CheckCircle2, Play } from "lucide-react";

interface Props {
  onComplete: (score: number, avgReactionMs: number) => void;
}

type Stage = "idle" | "reaction_wait" | "reaction_go" | "memory_show" | "memory_input" | "done";

export default function CognitiveMiniTest({ onComplete }: Props) {
  const [stage, setStage] = useState<Stage>("idle");

  // Part 1: Reaction Speed (3 trials)
  const [trial, setTrial] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [tooEarly, setTooEarly] = useState(false);
  const goTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Part 2: Working Memory (4-tile sequence on 3x3 grid)
  const [sequence, setSequence] = useState<number[]>([]);
  const [litTile, setLitTile] = useState<number | null>(null);
  const [userSeq, setUserSeq] = useState<number[]>([]);

  // Final Results
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [avgMs, setAvgMs] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startReactionTrial = (nextTrial: number) => {
    setTooEarly(false);
    setStage("reaction_wait");
    const delay = 1000 + Math.random() * 1800; // 1.0s - 2.8s
    timerRef.current = setTimeout(() => {
      goTimeRef.current = performance.now();
      setStage("reaction_go");
    }, delay);
    setTrial(nextTrial);
  };

  const handleStart = () => {
    setReactions([]);
    setUserSeq([]);
    setFinalScore(null);
    setAvgMs(null);
    startReactionTrial(1);
  };

  const handleReactionTap = () => {
    if (stage === "reaction_wait") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTooEarly(true);
      timerRef.current = setTimeout(() => startReactionTrial(trial), 900);
      return;
    }

    if (stage === "reaction_go") {
      const ms = Math.round(performance.now() - goTimeRef.current);
      const updated = [...reactions, ms];
      setReactions(updated);

      if (trial < 3) {
        startReactionTrial(trial + 1);
      } else {
        startMemoryRound(updated);
      }
    }
  };

  const startMemoryRound = (completedReactions: number[]) => {
    // Generate 4 random tiles (0-8)
    const seq: number[] = [];
    while (seq.length < 4) {
      const r = Math.floor(Math.random() * 9);
      if (seq[seq.length - 1] !== r) seq.push(r);
    }
    setSequence(seq);
    setUserSeq([]);
    setStage("memory_show");

    // Flash sequence one by one
    seq.forEach((tile, idx) => {
      setTimeout(() => setLitTile(tile), idx * 650 + 350);
      setTimeout(() => setLitTile(null), idx * 650 + 800);
    });

    setTimeout(() => {
      setStage("memory_input");
    }, seq.length * 650 + 450);

    // Keep reactions accessible
    setReactions(completedReactions);
  };

  const handleTileTap = (tileIdx: number) => {
    if (stage !== "memory_input") return;
    const nextUserSeq = [...userSeq, tileIdx];
    setUserSeq(nextUserSeq);

    if (nextUserSeq.length === sequence.length) {
      // Score calculation: 50 pts Reaction + 50 pts Memory
      const meanMs = Math.round(
        reactions.reduce((a, b) => a + b, 0) / Math.max(reactions.length, 1)
      );
      const reactionPts = Math.max(10, Math.min(50, Math.round(50 - (meanMs - 220) / 10)));

      let correctTiles = 0;
      sequence.forEach((val, i) => {
        if (nextUserSeq[i] === val) correctTiles++;
      });
      const memoryPts = Math.round((correctTiles / sequence.length) * 50);

      const total = Math.max(15, Math.min(100, reactionPts + memoryPts));
      setAvgMs(meanMs);
      setFinalScore(total);
      setStage("done");
      onComplete(total, meanMs);
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-[2rem] bg-[#e9d5ff] border-2 border-violet-300 shadow-2xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#2e1065] flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-700" />
          20-Sec Brain-Fog Mini-Test
        </h2>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#3b0764] text-white">
          Objective Score
        </span>
      </div>

      {/* IDLE */}
      {stage === "idle" && (
        <div className="bg-white/90 rounded-2xl p-5 border-2 border-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-bold text-[#2e1065]">
              Measure your real-time Attention &amp; Working Memory
            </p>
            <p className="text-xs text-violet-950/70 mt-1">
              Part 1: 3 quick reaction taps · Part 2: 4-tile sequence recall. Auto-attaches to today&apos;s log.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Test
          </button>
        </div>
      )}

      {/* PART 1: REACTION SPEED */}
      {(stage === "reaction_wait" || stage === "reaction_go") && (
        <button
          type="button"
          onClick={handleReactionTap}
          className={`w-full h-44 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition cursor-pointer select-none ${
            stage === "reaction_go"
              ? "bg-emerald-500 border-emerald-700 text-white scale-[1.01]"
              : tooEarly
              ? "bg-rose-500 border-rose-700 text-white"
              : "bg-[#3b0764] border-violet-900 text-violet-100"
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
            Part 1 of 2 · Attention ({trial}/3)
          </span>
          {stage === "reaction_go" ? (
            <span className="text-3xl font-black uppercase flex items-center gap-2">
              <Zap className="w-7 h-7 fill-current" /> TAP NOW!
            </span>
          ) : tooEarly ? (
            <span className="text-xl font-black uppercase">Too early! Wait for green...</span>
          ) : (
            <span className="text-xl font-black uppercase">Wait for Green...</span>
          )}
        </button>
      )}

      {/* PART 2: WORKING MEMORY */}
      {(stage === "memory_show" || stage === "memory_input") && (
        <div className="bg-white/90 rounded-2xl p-5 border-2 border-violet-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-1">
            Part 2 of 2 · Working Memory
          </div>
          <p className="text-xs font-bold text-[#2e1065] mb-4">
            {stage === "memory_show"
              ? "Watch the flashing pattern..."
              : `Tap the 4 tiles in order (${userSeq.length}/4)`}
          </p>

          <div className="grid grid-cols-3 gap-2.5 max-w-[210px] mx-auto">
            {Array.from({ length: 9 }).map((_, idx) => {
              const isLit = litTile === idx;
              const isPicked = stage === "memory_input" && userSeq.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={stage === "memory_show"}
                  onClick={() => handleTileTap(idx)}
                  className={`aspect-square rounded-xl border-2 transition cursor-pointer ${
                    isLit
                      ? "bg-[#7c3aed] border-[#2e1065] scale-105 shadow-lg"
                      : isPicked
                      ? "bg-[#c4b5fd] border-[#5b21b6]"
                      : "bg-[#f5f3ff] border-violet-200 hover:border-violet-400"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* DONE */}
      {stage === "done" && finalScore !== null && (
        <div className="bg-white rounded-2xl p-5 border-2 border-violet-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#3b0764] text-white flex flex-col items-center justify-center shrink-0">
              <span className="text-xl font-black leading-none">{finalScore}</span>
              <span className="text-[9px] uppercase font-bold text-violet-300">/100</span>
            </div>
            <div>
              <div className="text-xs font-black uppercase text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Attached to Today&apos;s Log
              </div>
              <p className="text-xs font-medium text-[#2e1065]/80 mt-0.5">
                Avg Reaction: <strong>{avgMs} ms</strong> · Click <strong>Save Daily Log</strong> on the left to store it.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-100 hover:bg-violet-200 text-[#2e1065] text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retake
          </button>
        </div>
      )}
    </div>
  );
}