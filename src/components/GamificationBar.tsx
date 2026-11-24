"use client";

import { Award, Flame, Sparkles, Trophy } from "lucide-react";

interface BadgeDef {
  id: string;
  label: string;
  desc: string;
  unlocked: boolean;
}

export default function GamificationBar({
  xp,
  streak,
  logsCount,
  bestReactionMs,
  bestStroopScore,
}: {
  xp: number;
  streak: number;
  logsCount: number;
  bestReactionMs: number | null;
  bestStroopScore: number | null;
}) {
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  const badges: BadgeDef[] = [
    {
      id: "first-log",
      label: "First Entry",
      desc: "Logged your first check-in",
      unlocked: logsCount >= 1,
    },
    {
      id: "streak-3",
      label: "3-Day Rhythm",
      desc: "Logged 3 days in a row",
      unlocked: streak >= 3,
    },
    {
      id: "reflex",
      label: "Quick Recall",
      desc: "Reaction under 400ms",
      unlocked: bestReactionMs !== null && bestReactionMs < 400,
    },
    {
      id: "stroop",
      label: "Sharp Focus",
      desc: "8+ on Stroop Sprint",
      unlocked: bestStroopScore !== null && bestStroopScore >= 8,
    },
  ];

  return (
    <div className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2F5D50]/10 border border-[#2F5D50]/20 flex items-center justify-center text-[#2F5D50]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-medium text-[#1C1F1D]">
                Level {level}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFECE6] text-[#4F5551]">
                {xp} XP
              </span>
            </div>
            <p className="text-xs text-[#6E7570]">
              {100 - progress} XP to Level {level + 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F5F0] border border-[#E3DDD2] text-xs font-semibold text-[#1C1F1D]">
          <Flame className="w-3.5 h-3.5 text-[#2F5D50]" />
          <span>{streak} day streak</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden">
        <div
          className="h-full bg-[#2F5D50] transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`p-2.5 rounded-xl border text-left transition ${
              b.unlocked
                ? "bg-[#F7F5F0] border-[#2F5D50]/40 text-[#1C1F1D]"
                : "bg-[#FAF9F6] border-[#EAE4D9] text-[#9AA09C] opacity-65"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {b.unlocked ? (
                <Sparkles className="w-3.5 h-3.5 text-[#2F5D50] shrink-0" />
              ) : (
                <Award className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{b.label}</span>
            </div>
            <p className="text-[11px] mt-0.5 leading-tight">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}