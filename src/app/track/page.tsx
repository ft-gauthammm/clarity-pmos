"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Printer,
  Download,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
} from "lucide-react";
import GamificationBar from "@/components/GamificationBar";
import CognitiveMiniTest from "@/components/CognitiveMiniTest";
import StroopGame from "@/components/StroopGame";

interface DailyEntry {
  id: string;
  date: string;
  brainFog: number;
  focus: number;
  energy: number;
  mood: number;
  sleepHours: number;
  cycleDay: string;
  symptoms: string[];
  notes: string;
}

const SYMPTOM_OPTIONS = [
  "Afternoon Crash",
  "Sugar Cravings",
  "Word-Finding Slip",
  "Restless Sleep",
  "Bloating",
  "Headache",
  "Low Motivation",
  "Steady Energy",
];

const STORAGE_KEY = "clarity_pmos_entries_v5";
const STATS_KEY = "clarity_pmos_stats_v5";

export default function TrackPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [xp, setXp] = useState(0);
  const [bestReactionMs, setBestReactionMs] = useState<number | null>(null);
  const [bestStroopScore, setBestStroopScore] = useState<number | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  // Form State
  const [date, setDate] = useState("");
  const [printDate, setPrintDate] = useState("");
  const [brainFog, setBrainFog] = useState(4);
  const [focus, setFocus] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [mood, setMood] = useState(7);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [cycleDay, setCycleDay] = useState("14");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setDate((prev) => prev || format(new Date(), "yyyy-MM-dd"));
    setPrintDate(format(new Date(), "MMM d, yyyy"));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
      const rawStats = localStorage.getItem(STATS_KEY);
      if (rawStats) {
        const parsed = JSON.parse(rawStats);
        setXp(parsed.xp || 0);
        setBestReactionMs(parsed.bestReactionMs ?? null);
        setBestStroopScore(parsed.bestStroopScore ?? null);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistEntries = (next: DailyEntry[]) => {
    const sorted = [...next].sort((a, b) => a.date.localeCompare(b.date));
    setEntries(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  };

  const persistStats = (
    nextXp: number,
    nextMs: number | null,
    nextStroop: number | null
  ) => {
    setXp(nextXp);
    setBestReactionMs(nextMs);
    setBestStroopScore(nextStroop);
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({
        xp: nextXp,
        bestReactionMs: nextMs,
        bestStroopScore: nextStroop,
      })
    );
  };

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const entryDate = date || format(new Date(), "yyyy-MM-dd");
    const newEntry: DailyEntry = {
      id: `${entryDate}-${Date.now()}`,
      date: entryDate,
      brainFog,
      focus,
      energy,
      mood,
      sleepHours,
      cycleDay,
      symptoms,
      notes,
    };
    const filtered = entries.filter((item) => item.date !== entryDate);
    persistEntries([...filtered, newEntry]);
    persistStats(xp + 30, bestReactionMs, bestStroopScore);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const loadDemoData = () => {
    const demo: DailyEntry[] = Array.from({ length: 7 }).map((_, idx) => {
      const d = format(subDays(new Date(), 6 - idx), "yyyy-MM-dd");
      const lowSleep = idx === 1 || idx === 4;
      return {
        id: `demo-${idx}`,
        date: d,
        brainFog: lowSleep ? 8 : 3 + (idx % 3),
        focus: lowSleep ? 4 : 7 + (idx % 2),
        energy: lowSleep ? 4 : 7,
        mood: lowSleep ? 5 : 8,
        sleepHours: lowSleep ? 5.5 : 7.5 + (idx % 2) * 0.5,
        cycleDay: String(10 + idx),
        symptoms: lowSleep
          ? ["Afternoon Crash", "Sugar Cravings", "Word-Finding Slip"]
          : ["Steady Energy"],
        notes: lowSleep
          ? "Short sleep window; noticed slower recall after lunch."
          : "Balanced protein breakfast and steady focus.",
      };
    });
    persistEntries(demo);
    persistStats(Math.max(xp, 210), bestReactionMs ?? 340, bestStroopScore ?? 9);
  };

  const clearAllData = () => {
    persistEntries([]);
    persistStats(0, null, null);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clarity-pmos-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Analytics & Pattern Engine
  const analytics = useMemo(() => {
    if (entries.length === 0) return null;
    const avgFog = (
      entries.reduce((s, e) => s + e.brainFog, 0) / entries.length
    ).toFixed(1);
    const avgFocus = (
      entries.reduce((s, e) => s + e.focus, 0) / entries.length
    ).toFixed(1);
    const avgSleep = (
      entries.reduce((s, e) => s + e.sleepHours, 0) / entries.length
    ).toFixed(1);

    const shortSleepDays = entries.filter((e) => e.sleepHours < 7);
    const goodSleepDays = entries.filter((e) => e.sleepHours >= 7);
    const shortFog = shortSleepDays.length
      ? (
          shortSleepDays.reduce((s, e) => s + e.brainFog, 0) /
          shortSleepDays.length
        ).toFixed(1)
      : null;
    const goodFog = goodSleepDays.length
      ? (
          goodSleepDays.reduce((s, e) => s + e.brainFog, 0) /
          goodSleepDays.length
        ).toFixed(1)
      : null;

    const counts: Record<string, number> = {};
    entries.forEach((e) =>
      e.symptoms.forEach((sym) => {
        counts[sym] = (counts[sym] || 0) + 1;
      })
    );
    const topSymptoms = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { avgFog, avgFocus, avgSleep, shortFog, goodFog, topSymptoms };
  }, [entries]);

  const streak = useMemo(() => {
    if (entries.length === 0) return 0;
    return Math.min(entries.length, 7);
  }, [entries]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1F1D]">
      {/* Top Bar (Hidden when printing) */}
      <header className="print:hidden border-b border-[#E3DDD2] bg-[#F7F5F0]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2F5D50]" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Clarity
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-xs font-medium text-[#5A605C]">
            <Link href="/" className="hover:text-[#1C1F1D] transition">
              Home
            </Link>
            <Link href="/guide" className="hover:text-[#1C1F1D] transition">
              Guide
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] font-semibold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Doctor Brief
            </button>
          </nav>
        </div>
      </header>

      {/* SCREEN VIEW */}
      <main className="print:hidden max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Page Header + Utility Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E3DDD2] pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50]">
              Daily Journal &amp; Cognitive Check
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal mt-1">
              Log today&apos;s signals
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadDemoData}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D5CEC2] hover:border-[#1C1F1D] text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2F5D50]" /> Load 7-Day Demo
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={entries.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D5CEC2] hover:border-[#1C1F1D] disabled:opacity-40 text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
            {entries.length > 0 && (
              <button
                type="button"
                onClick={clearAllData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#7A7F7B] hover:text-[#A84A32] transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* XP & Streak Bar */}
        <GamificationBar
          xp={xp}
          streak={streak}
          logsCount={entries.length}
          bestReactionMs={bestReactionMs}
          bestStroopScore={bestStroopScore}
        />

        {/* Daily Check-In Form + Cognitive Checks */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Cols: 30-Sec Logger */}
          <form
            onSubmit={handleSaveEntry}
            className="lg:col-span-7 bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 sm:p-7 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-4">
              <h2 className="font-serif text-xl font-medium">
                30-Second Check-In
              </h2>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs font-semibold bg-[#F7F5F0] border border-[#D8D0C3] rounded-lg px-3 py-1.5 text-[#1C1F1D]"
              />
            </div>

            {/* Sliders */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Brain Fog (1–10)</span>
                  <span className="text-[#2F5D50]">{brainFog}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={brainFog}
                  onChange={(e) => setBrainFog(Number(e.target.value))}
                  className="w-full accent-[#2F5D50]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Mental Focus (1–10)</span>
                  <span className="text-[#2F5D50]">{focus}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={focus}
                  onChange={(e) => setFocus(Number(e.target.value))}
                  className="w-full accent-[#2F5D50]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Physical Energy (1–10)</span>
                  <span className="text-[#2F5D50]">{energy}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-[#2F5D50]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Mood Stability (1–10)</span>
                  <span className="text-[#2F5D50]">{mood}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full accent-[#2F5D50]"
                />
              </div>
            </div>

            {/* Sleep & Cycle Day */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Sleep Hours
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={16}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full rounded-xl bg-[#F7F5F0] border border-[#D8D0C3] px-3.5 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Cycle Day (or N/A)
                </label>
                <input
                  type="text"
                  value={cycleDay}
                  onChange={(e) => setCycleDay(e.target.value)}
                  placeholder="e.g. 14 or N/A"
                  className="w-full rounded-xl bg-[#F7F5F0] border border-[#D8D0C3] px-3.5 py-2 text-sm font-medium"
                />
              </div>
            </div>

            {/* Symptom Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                Metabolic &amp; Cognitive Signals
              </label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map((sym) => {
                  const active = symptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                        active
                          ? "bg-[#2F5D50] text-[#F7F5F0] border-[#2F5D50]"
                          : "bg-[#F7F5F0] text-[#4F5551] border-[#D8D0C3] hover:border-[#1C1F1D]"
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
              <label className="block text-xs font-semibold mb-1.5">
                Field Notes (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Meals, stress, workouts, or context for your doctor..."
                className="w-full rounded-xl bg-[#F7F5F0] border border-[#D8D0C3] px-3.5 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] text-xs font-semibold tracking-wide transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Save Entry (+30 XP)
              </button>

              {savedBanner && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F5D50]">
                  <CheckCircle2 className="w-4 h-4" /> Saved locally
                </span>
              )}
            </div>
          </form>

          {/* Right 5 Cols: Brain Gym */}
          <div className="lg:col-span-5 space-y-6">
            <CognitiveMiniTest
              bestMs={bestReactionMs}
              onComplete={(ms) => {
                const nextBest =
                  bestReactionMs === null ? ms : Math.min(bestReactionMs, ms);
                persistStats(xp + 25, nextBest, bestStroopScore);
              }}
            />

            <StroopGame
              bestScore={bestStroopScore}
              onComplete={(sc) => {
                const nextBest =
                  bestStroopScore === null
                    ? sc
                    : Math.max(bestStroopScore, sc);
                persistStats(xp + 20, bestReactionMs, nextBest);
              }}
            />
          </div>
        </div>

        {/* Analytics & Chart */}
        {analytics && (
          <section className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50]">
                  On-Device Pattern Engine
                </p>
                <h2 className="font-serif text-2xl font-normal">
                  Trends &amp; Sleep Correlations ({entries.length} entries)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#1C1F1D] text-xs font-semibold hover:bg-[#1C1F1D] hover:text-[#F7F5F0] transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print 1-Page Doctor Brief
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2]">
                <p className="text-xs text-[#6E7570]">Average Brain Fog</p>
                <p className="font-serif text-2xl font-medium mt-1">
                  {analytics.avgFog} / 10
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2]">
                <p className="text-xs text-[#6E7570]">Average Focus</p>
                <p className="font-serif text-2xl font-medium mt-1">
                  {analytics.avgFocus} / 10
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2]">
                <p className="text-xs text-[#6E7570]">Sleep vs. Fog Link</p>
                <p className="font-serif text-sm font-medium mt-1.5 leading-snug">
                  {analytics.shortFog && analytics.goodFog
                    ? `<7h sleep: ${analytics.shortFog}/10 fog vs ≥7h: ${analytics.goodFog}/10`
                    : `Avg sleep: ${analytics.avgSleep} hrs/night`}
                </p>
              </div>
            </div>

            {/* Recharts Line Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entries}>
                  <CartesianGrid stroke="#E6E0D5" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#5A605C" }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 11, fill: "#5A605C" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF8F4",
                      borderColor: "#D8D0C3",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="focus"
                    name="Focus"
                    stroke="#2F5D50"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="brainFog"
                    name="Brain Fog"
                    stroke="#A84A32"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy"
                    stroke="#6E7570"
                    strokeWidth={1.75}
                    dot={{ r: 2.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </main>

      {/* PRINT-ONLY 1-PAGE CLINICAL DOCTOR BRIEF */}
      <section className="hidden print:block p-8 bg-white text-black space-y-6">
        <div className="border-b-2 border-black pb-3 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              Clarity — PMOS Symptom &amp; Cognitive Brief
            </h1>
            <p className="text-xs text-gray-600">
              Self-tracked patient log summary · Generated {printDate}
            </p>
          </div>
          <span className="text-xs font-semibold">
            {entries.length} logged days
          </span>
        </div>

        {analytics && (
          <div className="grid grid-cols-3 gap-4 border border-gray-300 p-4 rounded">
            <div>
              <p className="text-[11px] uppercase text-gray-500">Avg Brain Fog</p>
              <p className="text-lg font-bold">{analytics.avgFog} / 10</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-500">Avg Focus</p>
              <p className="text-lg font-bold">{analytics.avgFocus} / 10</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-500">Avg Sleep</p>
              <p className="text-lg font-bold">{analytics.avgSleep} hrs</p>
            </div>
          </div>
        )}

        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider mb-2">
            Recent Entries
          </h2>
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Date</th>
                <th className="border border-gray-300 p-2">Fog</th>
                <th className="border border-gray-300 p-2">Focus</th>
                <th className="border border-gray-300 p-2">Sleep</th>
                <th className="border border-gray-300 p-2 text-left">Signals</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(-7).map((e) => (
                <tr key={e.id}>
                  <td className="border border-gray-300 p-2">{e.date}</td>
                  <td className="border border-gray-300 p-2 text-center">
                    {e.brainFog}/10
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {e.focus}/10
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {e.sleepHours}h
                  </td>
                  <td className="border border-gray-300 p-2">
                    {e.symptoms.join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-300 pt-3 text-xs space-y-1">
          <p className="font-bold">
            Suggested Metabolic &amp; Endocrine Panels to Discuss:
          </p>
          <p>
            Fasting Insulin, HbA1c, Fasting Glucose, Lipid Panel, TSH / Free T4,
            Total &amp; Free Testosterone, DHEA-S, Vitamin B12 &amp; Vitamin D.
          </p>
          <p className="text-[11px] text-gray-500 pt-2">
            Disclaimer: Educational self-tracking summary only; not a medical
            diagnosis.
          </p>
        </div>
      </section>
    </div>
  );
}