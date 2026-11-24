"use client";

import { useState, useEffect } from "react";
import { Zap, Play, RotateCcw } from "lucide-react";

const COLORS = [
  { name: "FOREST", hex: "#2F5D50" },
  { name: "RUST", hex: "#A84A32" },
  { name: "OCHRE", hex: "#B07D2B" },
  { name: "SLATE", hex: "#3B5266" },
];

export default function StroopGame({
  bestScore,
  onComplete,
}: {
  bestScore: number | null;
  onComplete: (score: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [inkIdx, setInkIdx] = useState(1);

  const nextPrompt = () => {
    const w = Math.floor(Math.random() * COLORS.length);
    let ink = Math.floor(Math.random() * COLORS.length);
    if (ink === w) ink = (w + 1) % COLORS.length;
    setWordIdx(w);
    setInkIdx(ink);
  };

  const start = () => {
    setScore(0);
    setTimeLeft(15);
    setFinished(false);
    setRunning(true);
    nextPrompt();
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (finished) {
      onComplete(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const handleGuess = (idx: number) => {
    if (!running) return;
    if (idx === inkIdx) {
      setScore((s) => s + 1);
    }
    nextPrompt();
  };

  return (
    <div className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#2F5D50]" />
          <h3 className="font-serif text-lg font-medium text-[#1C1F1D]">
            15-Sec Stroop Sprint
          </h3>
        </div>
        {bestScore !== null && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFECE6] text-[#4F5551]">
            Best: {bestScore} pts
          </span>
        )}
      </div>

      {!running && !finished && (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-[#5A605C] leading-relaxed">
            Tap the <strong>ink color</strong> of the word—not what the word
            spells—as many times as you can in 15 seconds. (+20 XP)
          </p>
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> Start Sprint
          </button>
        </div>
      )}

      {running && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5A605C]">
            <span>Time: {timeLeft}s</span>
            <span>Score: {score}</span>
          </div>
          <div className="py-5 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] text-center">
            <span
              className="font-serif text-3xl font-bold tracking-widest"
              style={{ color: COLORS[inkIdx].hex }}
            >
              {COLORS[wordIdx].name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COLORS.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleGuess(i)}
                className="py-2 rounded-xl bg-white hover:bg-[#EFECE6] border border-[#D8D0C3] text-xs font-semibold tracking-wider text-[#1C1F1D] transition cursor-pointer"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-base font-medium text-[#1C1F1D]">
              Score: {score} correct in 15s
            </p>
            <p className="text-xs text-[#2F5D50] font-medium">+20 XP logged</p>
          </div>
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D5CEC2] bg-white text-xs font-semibold hover:border-[#1C1F1D] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Replay
          </button>
        </div>
      )}
    </div>
  );
}