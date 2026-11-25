"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowRight,
  Sparkles,
  Brain,
  HeartPulse,
  Moon,
  RotateCcw,
  CheckCircle2,
  Activity,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import CareCompanion from "@/components/CareCompanion";

interface StoredEntrySummary {
  date: string;
  brainFog?: number;
  sleepHours?: number;
}

interface StoredRunSummary {
  date: string;
}

const STORAGE_KEY = "clarity_pmos_entries_v8";
const STATS_KEY = "clarity_pmos_stats_v8";

const MYTH_CARDS = [
  {
    id: "ovary",
    tag: "PMOS Framing Shift",
    front: "“PMOS is just a cyst or period label.”",
    back: "PMOS (Polyendocrine Metabolic Ovarian Syndrome) reframes it as a broader endocrine and metabolic condition—tying hormones, insulin resistance, energy, mood, sleep, and cardiometabolic health together even when cycles are irregular or shifting.",
  },
  {
    id: "brain",
    tag: "PMOS & Cognition",
    front: "“Brain fog in PMOS is just being distracted.”",
    back: "Research on PCOS/PMOS cohorts—including midlife cognitive studies—points to patterns in attention, memory, and processing speed alongside sleep quality and blood-sugar swings, making objective mini-checks + daily ratings genuinely useful.",
  },
  {
    id: "perimeno",
    tag: "PMOS Across Life Stages",
    front: "“Hormone transitions later on don’t matter for PMOS.”",
    back: "During perimenopause and changing hormone stages, metabolic vulnerability can overlap with blood pressure and cholesterol shifts—so tracking individual PMOS symptoms and lab snapshots gives your doctor clearer context.",
  },
];

const TIME_WINDOWS = [
  {
    key: "morning",
    label: "Morning",
    cue: "PMOS sleep & baseline",
    detail:
      "Prior sleep hours set your starting cognitive runway. Logging sleep before caffeine or heavy carbs helps separate true sleep debt from midday PMOS dips.",
  },
  {
    key: "afternoon",
    label: "Afternoon",
    cue: "PMOS crashes & cravings",
    detail:
      "Post-meal energy dips, sugar cravings, bloating, and word-finding slips often show up here—rating each PMOS symptom individually (1–5) reveals what actually spikes.",
  },
  {
    key: "evening",
    label: "Evening",
    cue: "Late meals & wind-down",
    detail:
      "Late high-carb meals, high stress, or night sweats can carry over into the next day's PMOS fog and focus scores.",
  },
  {
    key: "cycle",
    label: "Cycle / Perimeno",
    cue: "Observable cues, zero guessing",
    detail:
      "Pick plain-language cues like Period/Bleeding, Post-Period, Pre-Period/PMS, or Irregular/Not Sure—no need to guess technical phases.",
  },
];

export default function HomePage() {
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});
  const [activeWindow, setActiveWindow] = useState<string>("afternoon");

  // Synced CareCompanion state from localStorage
  const [loggedToday, setLoggedToday] = useState(false);
  const [cognitiveDoneToday, setCognitiveDoneToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastSleepHours, setLastSleepHours] = useState<number | undefined>(
    undefined
  );
  const [lastFog, setLastFog] = useState<number | undefined>(undefined);

  // Interactive Sandbox Controls
  const [shortSleepSim, setShortSleepSim] = useState(true);
  const [lateCarbSim, setLateCarbSim] = useState(false);
  const [perimenoSim, setPerimenoSim] = useState(false);

  useEffect(() => {
    const todayIso = format(new Date(), "yyyy-MM-dd");

    try {
      const rawEntries = localStorage.getItem(STORAGE_KEY);
      if (rawEntries) {
        const parsed = JSON.parse(rawEntries);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed
            .filter(
              (item): item is StoredEntrySummary =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof item.date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(item.date)
            )
            .sort((a, b) => a.date.localeCompare(b.date));

          if (valid.length > 0) {
            const latest = valid[valid.length - 1];
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoggedToday(valid.some((e) => e.date === todayIso));
            setLastSleepHours(
              typeof latest.sleepHours === "number"
                ? latest.sleepHours
                : undefined
            );
            setLastFog(
              typeof latest.brainFog === "number" ? latest.brainFog : undefined
            );

            const uniqueDates = Array.from(
              new Set(valid.map((e) => e.date))
            ).sort((a, b) => b.localeCompare(a));
            const gapFromToday = differenceInCalendarDays(
              parseISO(todayIso),
              parseISO(uniqueDates[0])
            );

            if (gapFromToday <= 1) {
              let count = 1;
              for (let i = 0; i < uniqueDates.length - 1; i++) {
                if (
                  differenceInCalendarDays(
                    parseISO(uniqueDates[i]),
                    parseISO(uniqueDates[i + 1])
                  ) === 1
                ) {
                  count++;
                } else {
                  break;
                }
              }
              setStreak(count);
            }
          }
        }
      }

      const rawStats = localStorage.getItem(STATS_KEY);
      if (rawStats) {
        const parsedStats = JSON.parse(rawStats);
        if (parsedStats && Array.isArray(parsedStats.runs)) {
          setCognitiveDoneToday(
            parsedStats.runs.some(
              (r: StoredRunSummary) => r && r.date === todayIso
            )
          );
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const simData = useMemo(() => {
    const baseFog =
      3 +
      (shortSleepSim ? 3 : 0) +
      (lateCarbSim ? 2 : 0) +
      (perimenoSim ? 1 : 0);
    const baseFocus = Math.max(
      2,
      8 -
        (shortSleepSim ? 3 : 0) -
        (lateCarbSim ? 1 : 0) -
        (perimenoSim ? 1 : 0)
    );

    return [
      {
        slot: "8am",
        focus: Math.min(10, baseFocus + 1),
        fog: Math.max(1, baseFog - 1),
      },
      { slot: "11am", focus: baseFocus, fog: baseFog },
      {
        slot: "2pm",
        focus: Math.max(1, baseFocus - (lateCarbSim ? 2 : 1)),
        fog: Math.min(10, baseFog + (lateCarbSim ? 2 : 1)),
      },
      { slot: "5pm", focus: Math.max(2, baseFocus - 1), fog: baseFog },
      {
        slot: "9pm",
        focus: Math.min(9, baseFocus + (perimenoSim ? -1 : 1)),
        fog: Math.min(10, baseFog + (perimenoSim ? 1 : 0)),
      },
    ];
  }, [shortSleepSim, lateCarbSim, perimenoSim]);

  const currentWindow =
    TIME_WINDOWS.find((w) => w.key === activeWindow) || TIME_WINDOWS[1];

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#111412] text-[#1C1F1D] dark:text-[#ECEAE4] transition-colors">
      {/* Streamlined Top Nav */}
      <header className="border-b border-[#E3DDD2] dark:border-[#252B27] bg-[#F7F5F0]/90 dark:bg-[#111412]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F5D50] dark:bg-[#52A88E]" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Clarity
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 text-xs font-medium text-[#5A605C] dark:text-[#A4AAA6]">
            <Link
              href="/guide"
              className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] transition"
            >
              Toolkit &amp; Labs
            </Link>
            <Link
              href="/guide"
              className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] transition"
            >
              Guide
            </Link>
            <ThemeToggle />
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] dark:bg-[#52A88E] dark:hover:bg-[#66B89F] text-[#F7F5F0] dark:text-[#0F1311] font-semibold transition"
            >
              Open Tracker <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Hero with Bigger PMOS Spotlight */}
        <section className="space-y-6 border-b border-[#E3DDD2] dark:border-[#252B27] pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] text-xs font-semibold uppercase tracking-[0.16em] text-[#2F5D50] dark:text-[#66B89F]">
            <Sparkles className="w-3.5 h-3.5" /> PMOS · Polyendocrine Metabolic Ovarian Syndrome
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal leading-[1.06] max-w-4xl">
            <span className="text-[#2F5D50] dark:text-[#66B89F] font-medium">
              PMOS
            </span>{" "}
            fog, energy, and hormones—tracked clearly without the guesswork.
          </h1>

          <p className="text-base sm:text-lg text-[#4F5551] dark:text-[#B4BAB6] max-w-3xl leading-relaxed">
            <strong>PMOS</strong> looks beyond isolated cycle dates to connect{" "}
            <strong>hormones, metabolism, sleep, brain fog, and perimenopause/cardiometabolic health</strong>. Log individual symptoms (1–5), spot personal patterns in your browser, and print a 1-page summary for your doctor.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] dark:bg-[#52A88E] dark:hover:bg-[#66B89F] text-[#F7F5F0] dark:text-[#0F1311] text-xs font-semibold tracking-wide transition"
            >
              Start PMOS Daily Log <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-[#181D1A] border border-[#D5CEC2] dark:border-[#2E3631] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4] text-xs font-semibold transition"
            >
              PMOS Habits, Labs &amp; Sources
            </Link>
          </div>
        </section>

        {/* Dedicated Bigger PMOS Spotlight & Pillars + Synced Care Companion */}
        <section
          id="pmos-spotlight"
          className="bg-white/90 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] rounded-3xl p-7 sm:p-9 space-y-6"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F5D50] dark:text-[#66B89F]">
              PMOS Spotlight
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight">
              Why{" "}
              <span className="underline decoration-[#2F5D50] dark:decoration-[#66B89F] underline-offset-4">
                PMOS
              </span>{" "}
              changes how we read everyday signals
            </h2>
            <p className="text-sm sm:text-base text-[#5A605C] dark:text-[#A4AAA6] max-w-3xl leading-relaxed">
              Calling it <strong>Polyendocrine Metabolic Ovarian Syndrome (PMOS)</strong> keeps the focus on whole-body endocrine and metabolic interactions—not just reproductive symptoms—across every stage of life.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F5D50] dark:text-[#66B89F]">
                <Activity className="w-4 h-4" /> PMOS · Metabolic &amp; Glycemic
              </div>
              <p className="font-serif text-lg font-medium">
                Afternoon crashes &amp; cravings
              </p>
              <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
                Tracks bloating, sugar cravings, and energy dips individually alongside sleep and post-meal habits.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F5D50] dark:text-[#66B89F]">
                <Brain className="w-4 h-4" /> PMOS · Cognitive Clarity
              </div>
              <p className="font-serif text-lg font-medium">
                Brain fog &amp; focus baselines
              </p>
              <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
                Pairs 1–10 daily fog and focus ratings with quick reaction and Stroop checks against a 14-day personal baseline.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F5D50] dark:text-[#66B89F]">
                <HeartPulse className="w-4 h-4" /> PMOS · Perimenopause &amp; Heart
              </div>
              <p className="font-serif text-lg font-medium">
                BP, lipids &amp; hormone shifts
              </p>
              <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
                Supports perimenopause cues, blood pressure, and lipid snapshots for more informed doctor visits.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <CareCompanion
              loggedToday={loggedToday}
              cognitiveDoneToday={cognitiveDoneToday}
              streak={streak}
              lastSleepHours={lastSleepHours}
              lastFog={lastFog}
            />
          </div>
        </section>

        {/* Interactive PMOS Awareness Flip Cards */}
        <section id="learn-pmos" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F5D50] dark:text-[#66B89F]">
                Interactive PMOS Primer
              </p>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1">
                Tap any PMOS card to flip
              </h2>
            </div>
            <span className="text-xs text-[#6E7570] dark:text-[#8E9691]">
              {Object.values(flippedIds).filter(Boolean).length}/{MYTH_CARDS.length} explored
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {MYTH_CARDS.map((card) => {
              const isFlipped = !!flippedIds[card.id];
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toggleFlip(card.id)}
                  className={`text-left p-6 rounded-2xl border transition cursor-pointer min-h-56 flex flex-col justify-between gap-4 ${
                    isFlipped
                      ? "bg-[#1C1F1D] dark:bg-[#232B27] text-[#F7F5F0] border-[#1C1F1D] dark:border-[#52A88E]"
                      : "bg-white/90 dark:bg-[#181D1A] text-[#1C1F1D] dark:text-[#ECEAE4] border-[#E3DDD2] dark:border-[#252B27] hover:border-[#2F5D50] dark:hover:border-[#66B89F]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-widest ${
                          isFlipped
                            ? "text-[#A7D7C5]"
                            : "text-[#2F5D50] dark:text-[#66B89F]"
                        }`}
                      >
                        {card.tag}
                      </span>
                      <span
                        className={`text-xs inline-flex items-center gap-1 ${
                          isFlipped
                            ? "text-[#D5CEC2]"
                            : "text-[#6E7570] dark:text-[#8E9691]"
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />{" "}
                        {isFlipped ? "Show cue" : "Reveal"}
                      </span>
                    </div>

                    <p className="font-serif text-xl leading-snug">
                      {isFlipped ? card.back : card.front}
                    </p>
                  </div>

                  <p
                    className={`text-xs ${
                      isFlipped
                        ? "text-[#A7D7C5]"
                        : "text-[#6E7570] dark:text-[#8E9691]"
                    }`}
                  >
                    {isFlipped ? "Tap again to flip back" : "Tap to reveal PMOS insight"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Interactive Day-in-the-Life Explorer + Live Pattern Sandbox */}
        <section
          id="playground"
          className="grid lg:grid-cols-12 gap-8 items-start bg-white/85 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] rounded-3xl p-6 sm:p-8"
        >
          {/* Left 5 Cols: Time-of-Day Interactive Layer */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F5D50] dark:text-[#66B89F]">
              PMOS Across the Day
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal">
              Tap a window around PMOS cues
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {TIME_WINDOWS.map((win) => {
                const active = activeWindow === win.key;
                return (
                  <button
                    key={win.key}
                    type="button"
                    onClick={() => setActiveWindow(win.key)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      active
                        ? "bg-[#2F5D50] dark:bg-[#52A88E] text-[#F7F5F0] dark:text-[#0F1311] border-[#2F5D50] dark:border-[#52A88E]"
                        : "bg-[#F7F5F0] dark:bg-[#121614] text-[#1C1F1D] dark:text-[#ECEAE4] border-[#D8D0C3] dark:border-[#2B322E] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4]"
                    }`}
                  >
                    <p className="text-xs font-semibold">{win.label}</p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        active
                          ? "text-[#D9ECE6] dark:text-[#16211D]"
                          : "text-[#6E7570] dark:text-[#8E9691]"
                      }`}
                    >
                      {win.cue}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] space-y-2">
              <p className="font-serif text-lg font-medium">
                {currentWindow.label} — {currentWindow.cue}
              </p>
              <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
                {currentWindow.detail}
              </p>
            </div>
          </div>

          {/* Right 7 Cols: Interactive Pattern Sandbox */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F5D50] dark:text-[#66B89F]">
                  Interactive PMOS Sandbox
                </p>
                <h3 className="font-serif text-2xl font-normal">
                  Preview how factors shift focus &amp; fog
                </h3>
              </div>
              <span className="text-xs text-[#6E7570] dark:text-[#8E9691]">
                Illustrative preview
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShortSleepSim((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  shortSleepSim
                    ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] border-[#1C1F1D] dark:border-[#ECEAE4]"
                    : "bg-[#F7F5F0] dark:bg-[#121614] text-[#4F5551] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E]"
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Sleep &lt;6.5h
              </button>

              <button
                type="button"
                onClick={() => setLateCarbSim((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  lateCarbSim
                    ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] border-[#1C1F1D] dark:border-[#ECEAE4]"
                    : "bg-[#F7F5F0] dark:bg-[#121614] text-[#4F5551] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E]"
                }`}
              >
                <Brain className="w-3.5 h-3.5" /> Late High-Carb Meal
              </button>

              <button
                type="button"
                onClick={() => setPerimenoSim((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  perimenoSim
                    ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] border-[#1C1F1D] dark:border-[#ECEAE4]"
                    : "bg-[#F7F5F0] dark:bg-[#121614] text-[#4F5551] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E]"
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" /> Perimeno / Irregular Cue
              </button>
            </div>

            <div className="h-56 w-full bg-[#F7F5F0] dark:bg-[#121614] rounded-2xl p-3 border border-[#E3DDD2] dark:border-[#252B27]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simData}>
                  <CartesianGrid stroke="#E6E0D5" strokeDasharray="3 3" />
                  <XAxis dataKey="slot" tick={{ fontSize: 11, fill: "#5A605C" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#5A605C" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF8F4",
                      borderColor: "#D8D0C3",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="focus"
                    name="Focus"
                    stroke="#2F5D50"
                    fill="#2F5D50"
                    fillOpacity={0.18}
                    strokeWidth={2.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="fog"
                    name="Brain Fog"
                    stroke="#A84A32"
                    fill="#A84A32"
                    fillOpacity={0.15}
                    strokeWidth={2.25}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#5A605C] dark:text-[#A4AAA6]">
                <CheckCircle2 className="w-4 h-4 text-[#2F5D50] dark:text-[#66B89F]" />
                100% browser-stored · No account required
              </span>
              <Link
                href="/track"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#2F5D50] hover:bg-[#1C1F1D] dark:bg-[#52A88E] dark:hover:bg-[#66B89F] text-[#F7F5F0] dark:text-[#0F1311] text-xs font-semibold transition"
              >
                Log Your Real PMOS Day <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3DDD2] dark:border-[#252B27] bg-[#F7F5F0] dark:bg-[#111412] py-8 px-6 text-xs text-[#6E7570] dark:text-[#8E9691]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p>
            Clarity — PMOS awareness &amp; metabolic-cognitive companion. Educational only; not medical advice or diagnosis.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/track" className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4]">
              PMOS Tracker
            </Link>
            <Link href="/guide" className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4]">
              PMOS Guide &amp; Citations
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}