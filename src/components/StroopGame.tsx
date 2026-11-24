"use client";

import { useState, useEffect, useCallback } from "react";
import { Palette, Play, RotateCcw, Trophy } from "lucide-react";

const COLORS = [
  { name: "VIOLET", hex: "#7c3aed" },
  { name: "ROSE", hex: "#e11d48" },
  { name: "EMERALD", hex: "#059669" },
  { name: "AMBER", hex: "#d97706" },
];

interface Props {
  onFinish?: (score: number) => void;
}

export default function StroopGame({ onFinish }: Props) {
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [inkIdx, setInkIdx] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem("clarity_stroop_best");
    if (saved) setBest(Number(saved));
  }, []);

  const nextRound = useCallback(() => {
    const w = Math.floor(Math.random() * COLORS.length);
    let ink = Math.floor(Math.random() * COLORS.length);
    if (ink === w) ink = (ink + 1) % COLORS.length; // force mismatch for real Stroop effect
    setWordIdx(w);
    setInkIdx(ink);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (timeLeft <= 0) {
      setPlaying(false);
      setDone(true);
      if (score > best) {
        setBest(score);
        localStorage.setItem("clarity_stroop_best", String(score));
      }
      onFinish?.(score);
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, timeLeft, score, best, onFinish]);

  const start = () => {
    setScore(0);
    setTimeLeft(15);
    setDone(false);
    setPlaying(true);
    nextRound();
  };

  const handlePick = (idx: number) => {
    if (!playing) return;
    if (idx === inkIdx) {
      setScore((s) => s + 1);
    } else {
      setScore((s) => Math.max(0, s - 1));
    }
    nextRound();
  };

  return (
    <div className="p-6 sm:p-7 rounded-[2rem] bg-[#ddd6fe] border-2 border-violet-300 shadow-2xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#2e1065] flex items-center gap-2">
          <Palette className="w-5 h-5 text-violet-700" />
          15-Sec Stroop Focus Sprint
        </h2>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#3b0764] text-white flex items-center gap-1">
          <Trophy className="w-3 h-3 text-amber-300" /> Best: {best}
        </span>
      </div>

      {!playing && !done && (
        <div className="bg-white/90 rounded-2xl p-5 border-2 border-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-bold text-[#2e1065]">
              Tap the <span className="underline">INK COLOR</span>, ignore the word!
            </p>
            <p className="text-xs text-violet-950/70 mt-1">
              Trains attention &amp; verbal interference control in 15 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={start}
            className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Play Sprint
          </button>
        </div>
      )}

      {playing && (
        <div className="bg-white rounded-2xl p-5 border-2 border-violet-300 text-center">
          <div className="flex items-center justify-between text-xs font-black uppercase text-violet-800 mb-4">
            <span>Score: {score}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-100">
              {timeLeft}s left
            </span>
          </div>

          <div
            className="text-4xl sm:text-5xl font-black tracking-tight mb-6 select-none"
            style={{ color: COLORS[inkIdx].hex }}
          >
            {COLORS[wordIdx].name}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {COLORS.map((c, idx) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handlePick(idx)}
                className="py-2.5 rounded-xl text-xs font-black uppercase text-white shadow-sm hover:scale-[1.03] active:scale-95 transition cursor-pointer"
                style={{ backgroundColor: c.hex }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {done && (
        <div className="bg-white rounded-2xl p-5 border-2 border-violet-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase text-violet-700">
              Sprint Complete!
            </div>
            <p className="text-sm font-bold text-[#2e1065] mt-0.5">
              You scored <span className="text-xl font-black text-[#7c3aed]">{score}</span>{" "}
              {score >= best && score > 0 ? "🎉 New Personal Best!" : `(Best: ${best})`}
            </p>
          </div>
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3b0764] hover:bg-[#581c87] text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Play Again
          </button>
        </div>
      )}
    </div>
  );
}
