"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import {
  Brain,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Printer,
  Trash2,
  Stethoscope,
  Activity,
  Moon,
  Zap,
  TrendingUp,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DailyLog } from "../../types";
import { getLogs, saveLog, deleteLog, clearAllLogs } from "../../lib/storage";
import CognitiveMiniTest from "../../components/CognitiveMiniTest";
import StroopGame from "../../components/StroopGame";
import GamificationBar from "../../components/GamificationBar";

const SYMPTOMS = [
  "Fatigue",
  "Sugar Cravings",
  "Bloating",
  "Headache",
  "Acne / Skin Flare",
  "Irregular Bleeding",
  "Mood Shifts",
  "Hair Thinning",
];

const SCORE_LABELS: Record<string, string[]> = {
  brainFog: ["Clear", "Mild", "Moderate", "Heavy", "Severe"],
  focus: ["Scattered", "Low", "Okay", "Sharp", "Locked In"],
  energy: ["Drained", "Low", "Steady", "Good", "High"],
  mood: ["Low", "Uneasy", "Neutral", "Calm", "Great"],
};

export default function TrackPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [date, setDate] = useState("");
  const [cycleDay, setCycleDay] = useState<string>("");
  const [sleepHours, setSleepHours] = useState<string>("7.5");
  const [brainFog, setBrainFog] = useState(2);
  const [focus, setFocus] = useState(4);
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(4);
  const [physicalSymptoms, setPhysicalSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [cognitiveScore, setCognitiveScore] = useState<number | undefined>(
    undefined
  );
  const [reactionMs, setReactionMs] = useState<number | undefined>(undefined);
  const [activeGame, setActiveGame] = useState<"memory" | "stroop">("memory");
  const [stroopBest, setStroopBest] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const triggerConfetti = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1400);
  };

  useEffect(() => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setLogs(getLogs());
    const savedStroop = localStorage.getItem("clarity_stroop_best");
    if (savedStroop) setStroopBest(Number(savedStroop));
  }, []);

  const toggleSymptom = (symptom: string) => {
    setPhysicalSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const newLog: DailyLog = {
      id: `log-${date}`,
      date,
      cycleDay: cycleDay ? Number(cycleDay) : undefined,
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      brainFog,
      focus,
      energy,
      mood,
      cognitiveScore,
      reactionMs,
      physicalSymptoms,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveLog(newLog);
    setLogs(getLogs());
    setSavedToast(true);
    triggerConfetti();
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleLoadDemo = () => {
    const sample = [
      { fog: 1, focus: 5, energy: 4, mood: 4, sleep: 8, cycle: 14, sym: [] },
      { fog: 2, focus: 4, energy: 4, mood: 4, sleep: 7.5, cycle: 15, sym: ["Bloating"] },
      { fog: 2, focus: 4, energy: 3, mood: 3, sleep: 7, cycle: 16, sym: ["Sugar Cravings"] },
      { fog: 3, focus: 3, energy: 3, mood: 3, sleep: 6.5, cycle: 17, sym: ["Fatigue"] },
      { fog: 4, focus: 2, energy: 2, mood: 2, sleep: 5.5, cycle: 18, sym: ["Fatigue", "Headache"] },
      { fog: 3, focus: 3, energy: 3, mood: 3, sleep: 7, cycle: 19, sym: ["Bloating"] },
      { fog: 4, focus: 2, energy: 2, mood: 3, sleep: 6, cycle: 20, sym: ["Fatigue", "Sugar Cravings"] },
      { fog: 2, focus: 4, energy: 4, mood: 4, sleep: 8, cycle: 21, sym: [] },
      { fog: 3, focus: 3, energy: 3, mood: 3, sleep: 6.5, cycle: 22, sym: ["Mood Shifts", "Fatigue"] },
      { fog: 2, focus: 4, energy: 4, mood: 4, sleep: 7.5, cycle: 23, sym: [] },
    ];

    sample.forEach((s, i) => {
      const d = format(subDays(new Date(), sample.length - 1 - i), "yyyy-MM-dd");
      saveLog({
        id: `demo-${d}`,
        date: d,
        cycleDay: s.cycle,
        sleepHours: s.sleep,
        brainFog: s.fog,
        focus: s.focus,
        energy: s.energy,
        mood: s.mood,
        physicalSymptoms: s.sym,
        notes: "Demo entry",
        createdAt: new Date().toISOString(),
      });
    });

    setLogs(getLogs());
  };

  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clarity-pmos-backup-${date || "logs"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (logDate: string) => {
    deleteLog(logDate);
    setLogs(getLogs());
  };

  const chartData = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((l) => ({
        date: l.date.slice(5),
        "Brain Fog": l.brainFog,
        Focus: l.focus,
        Energy: l.energy,
      }));
  }, [logs]);

  const averages = useMemo(() => {
    if (logs.length === 0) return null;
    const sum = logs.reduce(
      (acc, l) => ({
        fog: acc.fog + l.brainFog,
        focus: acc.focus + l.focus,
        energy: acc.energy + l.energy,
        sleep: acc.sleep + (l.sleepHours ?? 0),
        sleepCount: acc.sleepCount + (l.sleepHours !== undefined ? 1 : 0),
      }),
      { fog: 0, focus: 0, energy: 0, sleep: 0, sleepCount: 0 }
    );
    return {
      fog: (sum.fog / logs.length).toFixed(1),
      focus: (sum.focus / logs.length).toFixed(1),
      energy: (sum.energy / logs.length).toFixed(1),
      sleep:
        sum.sleepCount > 0 ? (sum.sleep / sum.sleepCount).toFixed(1) : "—",
    };
  }, [logs]);

  // ON-DEVICE PATTERN ENGINE
  const insights = useMemo(() => {
    if (logs.length < 3) return null;

    // 1. Sleep vs Brain Fog correlation
    const lowSleep = logs.filter(
      (l) => l.sleepHours !== undefined && l.sleepHours < 7
    );
    const goodSleep = logs.filter(
      (l) => l.sleepHours !== undefined && l.sleepHours >= 7
    );

    let sleepMessage =
      "Log both low-sleep (<7h) and well-rested (7h+) days to unlock your personal sleep-fog correlation.";
    if (lowSleep.length > 0 && goodSleep.length > 0) {
      const lowFog =
        lowSleep.reduce((s, l) => s + l.brainFog, 0) / lowSleep.length;
      const goodFog =
        goodSleep.reduce((s, l) => s + l.brainFog, 0) / goodSleep.length;
      const diff = (lowFog - goodFog).toFixed(1);

      if (Number(diff) >= 0.4) {
        sleepMessage = `Your brain fog averages ${lowFog.toFixed(1)}/5 on <7h sleep vs. ${goodFog.toFixed(1)}/5 when you get 7h+ (+${diff} fog spike on short sleep).`;
      } else {
        sleepMessage = `Your brain fog stays relatively steady across sleep lengths (${lowFog.toFixed(1)}/5 on <7h vs ${goodFog.toFixed(1)}/5 on 7h+).`;
      }
    }

    // 2. Top recurring symptom
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      l.physicalSymptoms.forEach((sym) => {
        counts[sym] = (counts[sym] || 0) + 1;
      });
    });
    const sortedSyms = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topSymptom = sortedSyms.length > 0 ? sortedSyms[0] : null;
    const symptomMessage = topSymptom
      ? `"${topSymptom[0]}" is your most frequent signal — logged on ${Math.round(
          (topSymptom[1] / logs.length) * 100
        )}% of tracked days (${topSymptom[1]}/${logs.length}).`
      : "No physical symptoms logged yet — tap signals during check-ins to spot clusters.";

    // 3. Recent Focus Trend (last 3 days vs earlier)
    const chronological = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const recent = chronological.slice(-3);
    const earlier = chronological.slice(0, -3);
    let trendLabel: "Improving" | "Steady" | "Dipping" = "Steady";
    let trendMessage =
      "Your focus scores have stayed consistent across your recent check-ins.";

    if (earlier.length >= 2) {
      const recentAvg =
        recent.reduce((s, l) => s + l.focus, 0) / recent.length;
      const earlierAvg =
        earlier.reduce((s, l) => s + l.focus, 0) / earlier.length;
      const delta = recentAvg - earlierAvg;

      if (delta >= 0.4) {
        trendLabel = "Improving";
        trendMessage = `Focus is trending up (${recentAvg.toFixed(1)}/5 over your last 3 logs vs ${earlierAvg.toFixed(1)}/5 earlier).`;
      } else if (delta <= -0.4) {
        trendLabel = "Dipping";
        trendMessage = `Focus dipped slightly in your last 3 logs (${recentAvg.toFixed(1)}/5 vs ${earlierAvg.toFixed(1)}/5 earlier) — worth checking sleep & stress.`;
      }
    }

    return {
      sleepMessage,
      symptomMessage,
      trendLabel,
      trendMessage,
      topSymptomName: topSymptom ? topSymptom[0] : "None logged",
    };
  }, [logs]);

  return (
    <>
      {/* ==================== SCREEN UI (Hidden when Printing) ==================== */}
      <div className="print:hidden min-h-screen bg-[#160a24] text-[#1e1033] pb-20 selection:bg-violet-300 selection:text-violet-950">
        {/* v5: XP Confetti Toast Overlay */}
        {confetti && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            <div className="px-6 py-3 rounded-full bg-[#7c3aed] text-white font-black uppercase tracking-wider text-xs shadow-2xl border-2 border-violet-200 animate-bounce">
              ✨ +XP Earned!
            </div>
          </div>
        )}

        {/* Top Bar */}
        <nav className="sticky top-0 z-40 bg-[#160a24]/85 backdrop-blur-xl border-b border-violet-500/20">
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-200/80 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </Link>
              <div className="h-4 w-px bg-violet-500/30" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-black tracking-tight text-white uppercase text-sm sm:text-base">
                  Clarity Tracker
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/guide"
                className="hidden md:inline text-xs font-bold uppercase tracking-wider text-violet-200/80 hover:text-white transition mr-2"
              >
                Toolkit
              </Link>
              <button
                onClick={handleLoadDemo}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e9d5ff] hover:bg-white text-[#2e1065] text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-700" />
                <span className="hidden sm:inline">Load Demo Data</span>
                <span className="sm:hidden">Demo</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/30 text-violet-100 text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Doctor Brief</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid lg:grid-cols-12 gap-6 items-start">
          {/* Soft Ambient Glow */}
          <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/20 blur-[140px] -z-0" />

          {/* LEFT COLUMN: Daily Logger Card */}
          <section className="relative z-10 lg:col-span-5">
            <form
              onSubmit={handleSave}
              className="p-6 sm:p-7 rounded-[2rem] bg-[#f3eeff] border-2 border-violet-300 shadow-2xl space-y-5"
            >
              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-200 text-violet-900 mb-2">
                  30-Second Log
                </span>
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#2e1065]">
                  Daily Check-in
                </h1>
                <p className="text-xs font-medium text-violet-950/70 mt-0.5">
                  Stored privately on your device. Zero servers.
                </p>
              </div>

              {/* Date, Cycle Day, Sleep */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-violet-900 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border-2 border-violet-200 text-xs font-bold text-[#2e1065] focus:outline-none focus:border-violet-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-violet-900 mb-1.5">
                    Cycle Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="e.g. 14"
                    value={cycleDay}
                    onChange={(e) => setCycleDay(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border-2 border-violet-200 text-xs font-bold text-[#2e1065] placeholder:text-violet-400 focus:outline-none focus:border-violet-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-violet-900 mb-1.5 flex items-center gap-1">
                    <Moon className="w-3 h-3 text-violet-700" /> Sleep
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="16"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border-2 border-violet-200 text-xs font-bold text-[#2e1065] focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>

              {/* 1-5 Scale Selectors */}
              <div className="space-y-4">
                {[
                  { key: "brainFog", label: "Brain Fog", val: brainFog, set: setBrainFog },
                  { key: "focus", label: "Focus & Clarity", val: focus, set: setFocus },
                  { key: "energy", label: "Physical Energy", val: energy, set: setEnergy },
                  { key: "mood", label: "Mood", val: mood, set: setMood },
                ].map((metric) => (
                  <div
                    key={metric.key}
                    className="p-3.5 rounded-2xl bg-white/80 border-2 border-violet-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black uppercase tracking-wide text-[#2e1065]">
                        {metric.label}
                      </label>
                      <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                        {SCORE_LABELS[metric.key][metric.val - 1]} ({metric.val}/5)
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => metric.set(num)}
                          className={`py-2 rounded-xl text-sm font-black border-2 transition cursor-pointer ${
                            metric.val === num
                              ? "bg-[#7c3aed] border-[#3b0764] text-white shadow-sm scale-[1.03]"
                              : "bg-[#f5f3ff] border-violet-200 text-violet-900 hover:border-violet-400"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Physical Symptoms */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-[#2e1065] mb-2">
                  Physical &amp; Metabolic Signals
                </label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map((sym) => {
                    const active = physicalSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition cursor-pointer ${
                          active
                            ? "bg-[#3b0764] border-[#3b0764] text-white shadow-sm"
                            : "bg-white border-violet-200 text-violet-900 hover:border-violet-400"
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-[#2e1065] mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Sleep quality, meals, stress, study focus..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-violet-200 text-xs font-medium text-[#2e1065] placeholder:text-violet-400 focus:outline-none focus:border-violet-600"
                />
              </div>

              {/* Mini-Test Attached Badge */}
              {cognitiveScore !== undefined && (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>Mini-Test Ready to Save:</span>
                  <span className="font-black">
                    {cognitiveScore}/100 ({reactionMs}ms)
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#3b0764] hover:bg-[#581c87] text-white font-black uppercase tracking-wider text-xs transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                {savedToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Saved to Device!
                  </>
                ) : (
                  "Save Daily Log"
                )}
              </button>
            </form>
          </section>

          {/* RIGHT COLUMN: Stats, Gamification, Brain Gym, Smart Insights, Trends & Doctor Checklist */}
          <section className="relative z-10 lg:col-span-7 space-y-6">
            {/* Summary Stat Tiles */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-[1.75rem] bg-[#e9d5ff] border-2 border-violet-300 shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-900">
                  Avg Brain Fog
                </div>
                <div className="text-3xl font-black text-rose-600 mt-1">
                  {averages ? `${averages.fog}` : "—"}
                  {averages && <span className="text-sm text-violet-900/60">/5</span>}
                </div>
              </div>

              <div className="p-5 rounded-[1.75rem] bg-[#ddd6fe] border-2 border-violet-300 shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-900">
                  Avg Focus
                </div>
                <div className="text-3xl font-black text-[#6d28d9] mt-1">
                  {averages ? `${averages.focus}` : "—"}
                  {averages && <span className="text-sm text-violet-900/60">/5</span>}
                </div>
              </div>

              <div className="p-5 rounded-[1.75rem] bg-[#c4b5fd] border-2 border-violet-300 shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#2e1065]">
                  Avg Energy
                </div>
                <div className="text-3xl font-black text-emerald-700 mt-1">
                  {averages ? `${averages.energy}` : "—"}
                  {averages && <span className="text-sm text-[#2e1065]/60">/5</span>}
                </div>
              </div>
            </div>

            {/* v5: GAMIFICATION BAR */}
            <GamificationBar logs={logs} stroopBest={stroopBest} />

            {/* v5: TABBED BRAIN GYM (Memory/Reaction + Stroop Sprint) */}
            <div className="space-y-3">
              <div className="inline-flex p-1 rounded-full bg-violet-950/80 border border-violet-500/30">
                <button
                  type="button"
                  onClick={() => setActiveGame("memory")}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                    activeGame === "memory"
                      ? "bg-[#e9d5ff] text-[#2e1065]"
                      : "text-violet-300 hover:text-white"
                  }`}
                >
                  Reaction &amp; Memory
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGame("stroop")}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                    activeGame === "stroop"
                      ? "bg-[#ddd6fe] text-[#2e1065]"
                      : "text-violet-300 hover:text-white"
                  }`}
                >
                  15-Sec Stroop Sprint
                </button>
              </div>

              {activeGame === "memory" ? (
                <CognitiveMiniTest
                  onComplete={(score, ms) => {
                    setCognitiveScore(score);
                    setReactionMs(ms);
                    triggerConfetti();
                  }}
                />
              ) : (
                <StroopGame
                  onFinish={(score) => {
                    if (score > stroopBest) setStroopBest(score);
                    triggerConfetti();
                  }}
                />
              )}
            </div>

            {/* SMART PATTERN INSIGHTS ENGINE */}
            <div className="p-6 sm:p-7 rounded-[2rem] bg-[#3b0764] text-white border-2 border-violet-400/50 shadow-2xl">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-300" />
                  Smart Pattern Insights
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-500/30 border border-violet-300/30 text-violet-100">
                  PATTERN ENGINE
                </span>
              </div>

              {insights ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white/10 border border-violet-400/20 flex items-start gap-3">
                    <Moon className="w-4 h-4 text-violet-300 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
                      <strong className="text-white">Sleep × Fog Link:</strong>{" "}
                      {insights.sleepMessage}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-violet-400/20 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-fuchsia-300 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
                      <strong className="text-white">Top Signal:</strong>{" "}
                      {insights.symptomMessage}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-violet-400/20 flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
                      <strong className="text-white">
                        Focus Trend ({insights.trendLabel}):
                      </strong>{" "}
                      {insights.trendMessage}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/10 border border-dashed border-violet-400/30 text-xs text-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span>
                    Log at least <strong>3 days</strong> (or load Demo Data) to unlock automatic sleep-to-brain-fog correlation detection.
                  </span>
                  <button
                    onClick={handleLoadDemo}
                    className="shrink-0 px-4 py-1.5 rounded-full bg-white text-[#2e1065] text-[11px] font-black uppercase tracking-wider hover:bg-violet-100 transition cursor-pointer"
                  >
                    Unlock with Demo
                  </button>
                </div>
              )}
            </div>

            {/* Trend Chart Card */}
            <div className="p-6 sm:p-7 rounded-[2rem] bg-[#f3eeff] border-2 border-violet-300 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#2e1065] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-violet-700" />
                    Cognitive &amp; Energy Trends
                  </h2>
                  <p className="text-xs font-medium text-violet-950/70 mt-0.5">
                    Compare brain fog against focus and energy across your logs
                  </p>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-64 w-full bg-white rounded-2xl p-3 border-2 border-violet-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                      <XAxis dataKey="date" stroke="#5b21b6" fontSize={11} fontWeight={700} />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        stroke="#5b21b6"
                        fontSize={11}
                        fontWeight={700}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#2e1065",
                          color: "#ffffff",
                          border: "2px solid #a78bfa",
                          borderRadius: "14px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Brain Fog"
                        stroke="#e11d48"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Focus"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Energy"
                        stroke="#059669"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center text-center bg-white/80 border-2 border-dashed border-violet-300 rounded-2xl p-6">
                  <p className="text-xs sm:text-sm font-bold text-[#2e1065]/80 mb-4 max-w-sm">
                    No logs yet. Add your first check-in or load 10 days of sample data to see your pattern graph.
                  </p>
                  <button
                    onClick={handleLoadDemo}
                    className="px-6 py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
                  >
                    Load 10-Day Demo Data
                  </button>
                </div>
              )}
            </div>

            {/* When to talk to a doctor */}
            <div className="p-6 sm:p-7 rounded-[2rem] bg-[#e9d5ff] border-2 border-violet-300 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-black uppercase tracking-tight text-[#2e1065] flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-violet-700" />
                  When to talk to a doctor
                </h3>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-full bg-[#3b0764] hover:bg-[#581c87] text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3 h-3" /> Print 1-Page Brief
                </button>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-[#2e1065]/90 list-disc pl-5">
                <li>Cycles consistently longer than 35 days, missed periods, or irregular bleeding.</li>
                <li>Persistent brain fog or fatigue that interferes with classes, work, or daily recall.</li>
                <li>Signs of metabolic shift (intense sugar crashes, sudden weight changes, or skin darkening).</li>
                <li>
                  Bring your printed <strong>Doctor Brief</strong> to discuss hormonal &amp; metabolic screening (HbA1c, fasting insulin, thyroid, and androgen panel).
                </li>
              </ul>
            </div>

            {/* Recent Logs List + Backup + Clear All */}
            {logs.length > 0 && (
              <div className="p-6 sm:p-7 rounded-[2rem] bg-[#f3eeff] border-2 border-violet-300 shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-base font-black uppercase tracking-tight text-[#2e1065]">
                    Recent Logs ({logs.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border-2 border-violet-200 hover:border-violet-400 text-[10px] font-black uppercase tracking-wider text-violet-900 transition cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Backup
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Clear all saved logs from this device?")) {
                          clearAllLogs();
                          setLogs([]);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border-2 border-rose-200 hover:border-rose-400 text-[10px] font-black uppercase tracking-wider text-rose-700 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Clear All
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-2 border-violet-200 text-xs"
                    >
                      <div>
                        <span className="font-black text-[#2e1065]">{log.date}</span>
                        {log.cycleDay && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-bold text-[10px]">
                            Day {log.cycleDay}
                          </span>
                        )}
                        <div className="text-violet-950/80 font-semibold mt-1">
                          Fog: <span className="text-rose-600 font-black">{log.brainFog}</span> · Focus:{" "}
                          <span className="text-violet-700 font-black">{log.focus}</span> · Energy:{" "}
                          <span className="text-emerald-700 font-black">{log.energy}</span>
                          {log.sleepHours !== undefined && (
                            <> · Sleep: <span className="font-black">{log.sleepHours}h</span></>
                          )}
                          {log.cognitiveScore !== undefined && (
                            <> · Test: <span className="text-violet-800 font-black">{log.cognitiveScore}/100</span></>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(log.date)}
                        className="p-2 rounded-xl text-violet-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ==================== PRINT-ONLY CLINICAL DOCTOR BRIEF ==================== */}
      <div className="hidden print:block bg-white text-black p-6 max-w-4xl mx-auto font-sans">
        <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              CLARITY — PMOS Cognitive &amp; Symptom Brief
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Patient Self-Reported Summary · Polyendocrine Metabolic Ovarian Syndrome (formerly PCOS)
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>Generated: {date || "Today"}</div>
            <div>Logs Included: {logs.length} days</div>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="border border-gray-300 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-gray-500">Avg Brain Fog</div>
            <div className="text-xl font-bold mt-1">{averages ? `${averages.fog} / 5` : "—"}</div>
          </div>
          <div className="border border-gray-300 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-gray-500">Avg Focus</div>
            <div className="text-xl font-bold mt-1">{averages ? `${averages.focus} / 5` : "—"}</div>
          </div>
          <div className="border border-gray-300 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-gray-500">Avg Energy</div>
            <div className="text-xl font-bold mt-1">{averages ? `${averages.energy} / 5` : "—"}</div>
          </div>
          <div className="border border-gray-300 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-gray-500">Avg Sleep</div>
            <div className="text-xl font-bold mt-1">{averages ? `${averages.sleep} hrs` : "—"}</div>
          </div>
        </div>

        {/* Detected Patterns */}
        {insights && (
          <div className="border border-gray-300 rounded-lg p-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2">
              Detected Self-Tracking Patterns
            </h2>
            <ul className="text-xs space-y-1.5 list-disc pl-4">
              <li>{insights.sleepMessage}</li>
              <li>{insights.symptomMessage}</li>
              <li>{insights.trendMessage}</li>
            </ul>
          </div>
        )}

        {/* Recent Log Table */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">
            Recent Daily Entries (Last 10 Logs)
          </h2>
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border border-gray-300 p-2">Date</th>
                <th className="border border-gray-300 p-2">Cycle</th>
                <th className="border border-gray-300 p-2">Sleep</th>
                <th className="border border-gray-300 p-2">Fog</th>
                <th className="border border-gray-300 p-2">Focus</th>
                <th className="border border-gray-300 p-2">Energy</th>
                <th className="border border-gray-300 p-2">Mini-Test</th>
                <th className="border border-gray-300 p-2">Symptoms</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((l) => (
                <tr key={l.id}>
                  <td className="border border-gray-300 p-2 font-medium">{l.date}</td>
                  <td className="border border-gray-300 p-2">{l.cycleDay ?? "—"}</td>
                  <td className="border border-gray-300 p-2">{l.sleepHours ? `${l.sleepHours}h` : "—"}</td>
                  <td className="border border-gray-300 p-2">{l.brainFog}/5</td>
                  <td className="border border-gray-300 p-2">{l.focus}/5</td>
                  <td className="border border-gray-300 p-2">{l.energy}/5</td>
                  <td className="border border-gray-300 p-2">
                    {l.cognitiveScore !== undefined ? `${l.cognitiveScore}/100` : "—"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {l.physicalSymptoms.length > 0 ? l.physicalSymptoms.join(", ") : "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Clinical Discussion Checklist */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">
            Screening Panels to Discuss (PMOS / Metabolic Context)
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>☐ HbA1c &amp; Fasting Insulin / Glucose (OGTT)</div>
            <div>☐ Thyroid Panel (TSH, Free T4)</div>
            <div>☐ Androgen Panel (Free &amp; Total Testosterone)</div>
            <div>☐ Fasting Lipid Profile &amp; Vitamin B12 / D</div>
          </div>
        </div>

        <p className="text-[10px] text-gray-500 border-t border-gray-200 pt-3">
          Disclaimer: Generated locally by Clarity (educational self-tracking tool). Not a medical diagnosis. References: The Lancet PMOS Consensus (May 2026); UCSF Neurology Cognitive Study (2024).
        </p>
      </div>
    </>
  );
}