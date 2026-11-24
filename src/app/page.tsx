"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
} from "lucide-react";

const MYTH_CARDS = [
  {
    id: "ovary",
    tag: "Framing Shift",
    front: "“It’s mainly a cyst or period problem.”",
    back: "PMOS (Polyendocrine Metabolic Ovarian Syndrome) treats it as a whole-body endocrine and metabolic condition—affecting insulin sensitivity, energy, mood, sleep, and long-term cardiometabolic health, even when periods are regular or after cycles change.",
  },
  {
    id: "brain",
    tag: "Cognitive Link",
    front: "“Brain fog is just being distracted.”",
    back: "Research on PCOS/PMOS cohorts—including midlife cognitive studies—highlights links involving attention, memory, and processing speed alongside sleep quality and glycemic swings, which is why objective mini-checks + daily ratings help.",
  },
  {
    id: "perimeno",
    tag: "Long-Term Lens",
    front: "“Hormone shifts later in life don’t change risk.”",
    back: "During perimenopause and shifting hormone stages, existing insulin resistance can compound alongside changes in blood pressure and cholesterol—making individual symptom tracking and lab snapshots valuable for doctor visits.",
  },
];

const TIME_WINDOWS = [
  {
    key: "morning",
    label: "Morning",
    cue: "Sleep recovery & baseline",
    detail:
      "Prior sleep hours set your starting cognitive runway. Logging sleep before caffeine or heavy carbs helps separate true sleep debt from midday dips.",
  },
  {
    key: "afternoon",
    label: "Afternoon",
    cue: "Focus, cravings & crashes",
    detail:
      "Post-meal energy dips, sugar cravings, bloating, and word-finding slips often cluster here—tracking each symptom with its own 1–5 severity shows what actually spikes.",
  },
  {
    key: "evening",
    label: "Evening",
    cue: "Late meals, stress & wind-down",
    detail:
      "Late high-carb meals, high stress, or night sweats can echo into the next day's fog and focus scores.",
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

  // Interactive Sandbox Controls
  const [shortSleepSim, setShortSleepSim] = useState(true);
  const [lateCarbSim, setLateCarbSim] = useState(false);
  const [perimenoSim, setPerimenoSim] = useState(false);

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const simData = useMemo(() => {
    const baseFog = 3 + (shortSleepSim ? 3 : 0) + (lateCarbSim ? 2 : 0) + (perimenoSim ? 1 : 0);
    const baseFocus = Math.max(
      2,
      8 - (shortSleepSim ? 3 : 0) - (lateCarbSim ? 1 : 0) - (perimenoSim ? 1 : 0)
    );

    return [
      { slot: "8am", focus: Math.min(10, baseFocus + 1), fog: Math.max(1, baseFog - 1) },
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
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1F1D]">
      {/* Top Nav */}
      <header className="border-b border-[#E3DDD2] bg-[#F7F5F0]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F5D50]" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Clarity
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-xs font-medium text-[#5A605C]">
            <a href="#learn-pmos" className="hover:text-[#1C1F1D] transition">
              About PMOS
            </a>
            <a href="#playground" className="hover:text-[#1C1F1D] transition">
              Try Sandbox
            </a>
            <Link href="/guide" className="hover:text-[#1C1F1D] transition">
              Toolkit &amp; Labs
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] font-semibold transition"
            >
              Open Tracker <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <section className="space-y-6 border-b border-[#E3DDD2] pb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#E3DDD2] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2F5D50]">
            <Sparkles className="w-3.5 h-3.5" /> PMOS Awareness &amp; Interactive Pattern Companion
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal leading-[1.08] max-w-4xl">
            Understand your fog, energy, and hormones—without the guesswork.
          </h1>

          <p className="text-sm sm:text-base text-[#5A605C] max-w-2xl leading-relaxed">
            Built around the <strong>PMOS (Polyendocrine Metabolic Ovarian Syndrome)</strong> perspective, Clarity helps you spot how sleep, meals, cycle or perimenopause cues, and individual symptoms connect—stored privately in your browser with a 1-page summary for doctor visits.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] text-xs font-semibold tracking-wide transition"
            >
              Start Daily Log <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-[#D5CEC2] hover:border-[#1C1F1D] text-xs font-semibold transition"
            >
              Explore Habits, Labs &amp; Sources
            </Link>
          </div>
        </section>

        {/* Interactive PMOS Awareness Flip Cards */}
        <section id="learn-pmos" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50]">
                Interactive PMOS Primer
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1">
                Tap any card to flip the framing
              </h2>
            </div>
            <span className="text-xs text-[#6E7570]">
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
                  className={`text-left p-6 rounded-2xl border transition cursor-pointer min-h-52 flex flex-col justify-between gap-4 ${
                    isFlipped
                      ? "bg-[#1C1F1D] text-[#F7F5F0] border-[#1C1F1D]"
                      : "bg-white/90 text-[#1C1F1D] border-[#E3DDD2] hover:border-[#2F5D50]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-widest ${
                          isFlipped ? "text-[#A7D7C5]" : "text-[#2F5D50]"
                        }`}
                      >
                        {card.tag}
                      </span>
                      <span
                        className={`text-[11px] inline-flex items-center gap-1 ${
                          isFlipped ? "text-[#D5CEC2]" : "text-[#6E7570]"
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />{" "}
                        {isFlipped ? "Show cue" : "Reveal"}
                      </span>
                    </div>

                    <p className="font-serif text-lg leading-snug">
                      {isFlipped ? card.back : card.front}
                    </p>
                  </div>

                  <p
                    className={`text-[11px] ${
                      isFlipped ? "text-[#A7D7C5]" : "text-[#6E7570]"
                    }`}
                  >
                    {isFlipped ? "Tap again to flip back" : "Tap to read why it matters"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Interactive Day-in-the-Life Explorer + Live Pattern Sandbox */}
        <section
          id="playground"
          className="grid lg:grid-cols-12 gap-8 items-start bg-white/85 border border-[#E3DDD2] rounded-3xl p-6 sm:p-8"
        >
          {/* Left 5 Cols: Time-of-Day Interactive Layer */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50]">
              How Signals Shift
            </p>
            <h2 className="font-serif text-2xl font-normal">
              Pick a window to see what to watch
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
                        ? "bg-[#2F5D50] text-[#F7F5F0] border-[#2F5D50]"
                        : "bg-[#F7F5F0] text-[#1C1F1D] border-[#D8D0C3] hover:border-[#1C1F1D]"
                    }`}
                  >
                    <p className="text-xs font-semibold">{win.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        active ? "text-[#D9ECE6]" : "text-[#6E7570]"
                      }`}
                    >
                      {win.cue}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-2">
              <p className="font-serif text-base font-medium text-[#1C1F1D]">
                {currentWindow.label} — {currentWindow.cue}
              </p>
              <p className="text-xs text-[#5A605C] leading-relaxed">
                {currentWindow.detail}
              </p>
            </div>
          </div>

          {/* Right 7 Cols: Interactive Pattern Sandbox */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50]">
                  Interactive Sandbox
                </p>
                <h3 className="font-serif text-xl font-normal">
                  Toggle factors to preview focus vs. fog
                </h3>
              </div>
              <span className="text-[11px] text-[#6E7570]">
                Illustrative preview
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShortSleepSim((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  shortSleepSim
                    ? "bg-[#1C1F1D] text-[#F7F5F0] border-[#1C1F1D]"
                    : "bg-[#F7F5F0] text-[#4F5551] border-[#D8D0C3]"
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Sleep &lt;6.5h
              </button>

              <button
                type="button"
                onClick={() => setLateCarbSim((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  lateCarbSim
                    ? "bg-[#1C1F1D] text-[#F7F5F0] border-[#1C1F1D]"
                    : "bg-[#F7F5F0] text-[#4F5551] border-[#D8D0C3]"
                }`}
              >
                <Brain className="w-3.5 h-3.5" /> Late High-Carb Meal
              </button>

              <button
                type="button"
                onClick={() => setPerimenoSim((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  perimenoSim
                    ? "bg-[#1C1F1D] text-[#F7F5F0] border-[#1C1F1D]"
                    : "bg-[#F7F5F0] text-[#4F5551] border-[#D8D0C3]"
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" /> Perimeno / Irregular Cue
              </button>
            </div>

            <div className="h-56 w-full bg-[#F7F5F0] rounded-2xl p-3 border border-[#E3DDD2]">
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
              <span className="inline-flex items-center gap-1.5 text-xs text-[#5A605C]">
                <CheckCircle2 className="w-4 h-4 text-[#2F5D50]" />
                100% browser-stored · No account required
              </span>
              <Link
                href="/track"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#2F5D50] hover:bg-[#1C1F1D] text-[#F7F5F0] text-xs font-semibold transition"
              >
                Log Your Real Day <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3DDD2] bg-[#F7F5F0] py-8 px-6 text-xs text-[#6E7570]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p>
            Clarity — Educational PMOS &amp; metabolic-cognitive companion. Not medical advice or diagnosis.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/track" className="hover:text-[#1C1F1D]">
              Tracker
            </Link>
            <Link href="/guide" className="hover:text-[#1C1F1D]">
              Guide &amp; Citations
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}