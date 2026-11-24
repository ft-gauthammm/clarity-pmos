"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const STATES = [
  {
    id: "clear",
    label: "Clear",
    summary: "Steady attention and low fog—good window for deep work.",
  },
  {
    id: "hazy",
    label: "Hazy",
    summary: "Mild cognitive drag—check sleep hours, hydration, and pacing.",
  },
  {
    id: "heavy",
    label: "Heavy",
    summary: "High fog or fatigue—log today's signals and keep expectations light.",
  },
];

export default function HomePage() {
  const [activeState, setActiveState] = useState(0);
  const [viewMode, setViewMode] = useState<"pmos" | "pcos">("pmos");

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1F1D] selection:bg-[#2F5D50]/15 selection:text-[#1C1F1D]">
      {/* Minimal Top Bar */}
      <header className="border-b border-[#E3DDD2] bg-[#F7F5F0]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2F5D50]" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Clarity
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-xs font-medium text-[#5A605C]">
            <Link href="/track" className="hover:text-[#1C1F1D] transition">
              Tracker
            </Link>
            <Link href="/guide" className="hover:text-[#1C1F1D] transition">
              Guide
            </Link>
            <Link
              href="/track"
              className="px-4 py-1.5 rounded-full bg-[#1C1F1D] text-[#F7F5F0] hover:bg-[#2F5D50] transition"
            >
              Open Log
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-24 space-y-16">
        {/* Centered / Asymmetric Editorial Hero */}
        <section className="grid md:grid-cols-12 gap-10 items-end border-b border-[#E3DDD2] pb-14">
          <div className="md:col-span-8 space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50]">
              PMOS Cognitive &amp; Metabolic Companion
            </p>

            <h1 className="font-serif text-4xl sm:text-6xl leading-[1.06] tracking-tight font-normal text-[#1C1F1D]">
              Notice the shifts in your focus before they turn into guesswork.
            </h1>

            <p className="text-sm sm:text-base text-[#4F5551] max-w-xl leading-relaxed">
              Clarity pairs 30-second daily check-ins, short cognitive exercises,
              and local pattern insights with a printable 1-page clinical brief—all
              stored privately in your browser.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] text-xs font-semibold tracking-wide transition"
              >
                Start a Check-In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D5CEC2] bg-white/70 hover:bg-white text-[#1C1F1D] text-xs font-semibold tracking-wide transition"
              >
                Explore Toolkit
              </Link>
            </div>
          </div>

          {/* Right Side: Interactive Headspace Strip */}
          <div className="md:col-span-4 bg-white/80 border border-[#E3DDD2] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#6E7570] font-semibold">
              <span>Quick Pulse</span>
              <span>Offline</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-[#F2EFE9] p-1 rounded-xl">
              {STATES.map((st, i) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveState(i)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeState === i
                      ? "bg-white text-[#1C1F1D] shadow-2xs"
                      : "text-[#5A605C] hover:text-[#1C1F1D]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <p className="font-serif text-base text-[#1C1F1D] leading-snug">
              {STATES[activeState].summary}
            </p>
          </div>
        </section>

        {/* Three Numbered Pillars */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/75 border border-[#E3DDD2] rounded-2xl p-6 space-y-2">
            <span className="font-serif italic text-sm text-[#2F5D50]">01</span>
            <h2 className="font-serif text-xl font-medium">Daily Signals</h2>
            <p className="text-xs sm:text-sm text-[#5A605C] leading-relaxed">
              Log brain fog, focus, energy, mood, sleep, cycle day, and
              metabolic symptoms in under a minute with zero account setup.
            </p>
          </div>

          <div className="bg-white/75 border border-[#E3DDD2] rounded-2xl p-6 space-y-2">
            <span className="font-serif italic text-sm text-[#2F5D50]">02</span>
            <h2 className="font-serif text-xl font-medium">Brief Cognitive Checks</h2>
            <p className="text-xs sm:text-sm text-[#5A605C] leading-relaxed">
              Run a 20-second reaction and memory check or a 15-second Stroop
              sprint to pair subjective fog with objective focus data.
            </p>
          </div>

          <div className="bg-white/75 border border-[#E3DDD2] rounded-2xl p-6 space-y-2">
            <span className="font-serif italic text-sm text-[#2F5D50]">03</span>
            <h2 className="font-serif text-xl font-medium">Doctor Brief</h2>
            <p className="text-xs sm:text-sm text-[#5A605C] leading-relaxed">
              Export a clean 1-page summary of sleep links, recurring symptoms,
              and metabolic panels to take into medical appointments.
            </p>
          </div>
        </section>

        {/* Terminology Note (PMOS vs PCOS) */}
        <section className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50]">
              <Check className="w-3.5 h-3.5" /> Context
            </div>
            {viewMode === "pmos" ? (
              <p className="font-serif text-lg sm:text-xl text-[#1C1F1D] leading-relaxed">
                <strong>PMOS</strong> (Polyendocrine Metabolic Ovarian Syndrome)
                frames the condition around endocrine and metabolic health
                alongside reproductive and cognitive patterns.
              </p>
            ) : (
              <p className="font-serif text-lg sm:text-xl text-[#1C1F1D] leading-relaxed">
                <strong>PCOS</strong> was the older ovarian-focused label, which
                often missed broader metabolic and cognitive dimensions now
                grouped under PMOS.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("pmos")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                viewMode === "pmos"
                  ? "bg-[#1C1F1D] text-[#F7F5F0]"
                  : "bg-[#EFECE6] text-[#5A605C]"
              }`}
            >
              PMOS View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pcos")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                viewMode === "pcos"
                  ? "bg-[#1C1F1D] text-[#F7F5F0]"
                  : "bg-[#EFECE6] text-[#5A605C]"
              }`}
            >
              PCOS Context
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}