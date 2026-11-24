"use client";

import { Flame, Award, Sparkles, Moon, Brain, CheckCircle2 } from "lucide-react";
import { DailyLog } from "../types";

interface Props {
  logs: DailyLog[];
  stroopBest: number;
}

export default function GamificationBar({ logs, stroopBest }: Props) {
  // XP Calculation: 20 XP per log + 30 XP per Mini-Test + 5 XP per Stroop best point
  const testCount = logs.filter((l) => l.cognitiveScore !== undefined).length;
  const xp = logs.length * 20 + testCount * 30 + stroopBest * 5;
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;

  // Badges
  const badges = [
    {
      id: "first",
      label: "First Spark",
      desc: "Log 1 day",
      unlocked: logs.length >= 1,
      icon: Sparkles,
    },
    {
      id: "pattern",
      label: "Pattern Seeker",
      desc: "3+ days logged",
      unlocked: logs.length >= 3,
      icon: Flame,
    },
    {
      id: "sharp",
      label: "Sharp Mind",
      desc: "80+ Mini-Test or 10+ Stroop",
      unlocked:
        logs.some((l) => (l.cognitiveScore ?? 0) >= 80) || stroopBest >= 10,
      icon: Brain,
    },
    {
      id: "sleep",
      label: "Sleep Scientist",
      desc: "3+ days of 7.5h sleep",
      unlocked: logs.filter((l) => (l.sleepHours ?? 0) >= 7.5).length >= 3,
      icon: Moon,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="p-5 sm:p-6 rounded-[2rem] bg-gradient-to-br from-[#3b0764] to-[#220e38] text-white border-2 border-violet-400/40 shadow-2xl space-y-4">
      {/* Top Row: Level + XP Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#7c3aed] border-2 border-violet-300 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[9px] font-black uppercase leading-none text-violet-200">
              LVL
            </span>
            <span className="text-lg font-black leading-none">{level}</span>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-violet-200 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-300" />
              Clarity Explorer · {xp} XP
            </div>
            <div className="text-[11px] text-violet-300/80">
              {100 - levelProgress} XP to Level {level + 1} · {unlockedCount}/4 Badges
            </div>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-white/10 border border-violet-400/30 text-xs font-black flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-300" />
          {logs.length} {logs.length === 1 ? "Day" : "Days"} Tracked
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500"
          style={{ width: `${levelProgress}%` }}
        />
      </div>

      {/* 4 Unlockable Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              className={`p-3 rounded-2xl border transition ${
                b.unlocked
                  ? "bg-white/15 border-violet-300/50 text-white"
                  : "bg-black/20 border-white/10 text-violet-300/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    b.unlocked ? "text-amber-300" : "text-violet-400/30"
                  }`}
                />
                {b.unlocked && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                )}
              </div>
              <div className="text-[11px] font-black uppercase leading-tight">
                {b.label}
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
