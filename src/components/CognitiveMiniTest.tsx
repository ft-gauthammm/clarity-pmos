"use client";

import { useState, useRef } from "react";
import { Brain, Play, RotateCcw } from "lucide-react";

const WORDS = ["EMBER", "CEDAR", "RIVER", "CLOUD", "STONE", "FLORA", "LUNAR", "PULSE"];

export default function CognitiveMiniTest({
  bestMs,
  onComplete,
}: {
  bestMs: number | null;
  onComplete: (reactionMs: number, memoryCorrect: boolean) => void;
}) {
  const [stage, setStage] = useState<"idle" | "memorize" | "wait" | "click" | "recall" | "done">("idle");
  const [targetWord, setTargetWord] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [memoryCorrect, setMemoryCorrect] = useState<boolean | null>(null);
  const startRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTest = () => {
    const picked = WORDS[Math.floor(Math.random() * WORDS.length)];
    const distractors = WORDS.filter((w) => w !== picked)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    setTargetWord(picked);
    setOptions([picked, ...distractors].sort(() => Math.random() - 0.5));
    setReactionMs(null);
    setMemoryCorrect(null);
    setStage("memorize");

    timerRef.current = setTimeout(() => {
      setStage("wait");
      const delay = 1200 + Math.random() * 1800;
      timerRef.current = setTimeout(() => {
        startRef.current = performance.now();
        setStage("click");
      }, delay);
    }, 2200);
  };

  const handleTap = () => {
    if (stage !== "click") return;
    const elapsed = Math.round(performance.now() - startRef.current);
    setReactionMs(elapsed);
    setStage("recall");
  };

  const handleRecall = (choice: string) => {
    const ok = choice === targetWord;
    setMemoryCorrect(ok);
    setStage("done");
    if (reactionMs !== null) {
      onComplete(reactionMs, ok);
    }
  };

  return (
    <div className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#2F5D50]" />
          <h3 className="font-serif text-lg font-medium text-[#1C1F1D]">
            20-Sec Reaction &amp; Recall
          </h3>
        </div>
        {bestMs !== null && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFECE6] text-[#4F5551]">
            Best: {bestMs}ms
          </span>
        )}
      </div>

      {stage === "idle" && (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-[#5A605C] leading-relaxed">
            Memorize a 5-letter word, tap as soon as the card turns botanical green,
            then recall the word. (+25 XP)
          </p>
          <button
            type="button"
            onClick={startTest}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> Start Check
          </button>
        </div>
      )}

      {stage === "memorize" && (
        <div className="p-6 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] text-center space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-[#6E7570] font-semibold">
            Remember this word
          </p>
          <p className="font-serif text-3xl font-semibold tracking-widest text-[#1C1F1D]">
            {targetWord}
          </p>
        </div>
      )}

      {stage === "wait" && (
        <div className="p-6 rounded-xl bg-[#EFECE6] border border-[#D8D0C3] text-center">
          <p className="font-serif text-base text-[#5A605C]">
            Wait for green...
          </p>
        </div>
      )}

      {stage === "click" && (
        <button
          type="button"
          onClick={handleTap}
          className="w-full p-6 rounded-xl bg-[#2F5D50] text-[#F7F5F0] text-center font-serif text-xl font-medium cursor-pointer transition"
        >
          Tap Now!
        </button>
      )}

      {stage === "recall" && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6E7570]">
            Reaction: {reactionMs}ms — Which word appeared?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleRecall(opt)}
                className="py-2.5 px-3 rounded-xl bg-[#F7F5F0] hover:bg-[#2F5D50] hover:text-[#F7F5F0] border border-[#E3DDD2] text-xs font-semibold tracking-wider transition cursor-pointer"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-base font-medium text-[#1C1F1D]">
              {reactionMs}ms · {memoryCorrect ? "Word recalled" : `Word was ${targetWord}`}
            </p>
            <p className="text-xs text-[#2F5D50] font-medium">+25 XP logged</p>
          </div>
          <button
            type="button"
            onClick={startTest}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D5CEC2] bg-white text-xs font-semibold hover:border-[#1C1F1D] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Again
          </button>
        </div>
      )}
    </div>
  );
}