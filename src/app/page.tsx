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
        {/* Asymmetric Editorial Hero */}
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

        {/* Expanded Terminology & Clinical Context (PMOS vs PCOS) */}
        <section className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EFECE6] pb-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2F5D50]">
                <Check className="w-3.5 h-3.5" /> Clinical Context
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1C1F1D]">
                {viewMode === "pmos"
                  ? "Why PCOS was reframed as PMOS"
                  : "Limitations of the legacy PCOS label"}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("pmos")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                  viewMode === "pmos"
                    ? "bg-[#1C1F1D] text-[#F7F5F0]"
                    : "bg-[#EFECE6] text-[#5A605C] hover:text-[#1C1F1D]"
                }`}
              >
                PMOS View (2026)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pcos")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                  viewMode === "pcos"
                    ? "bg-[#1C1F1D] text-[#F7F5F0]"
                    : "bg-[#EFECE6] text-[#5A605C] hover:text-[#1C1F1D]"
                }`}
              >
                Legacy PCOS
              </button>
            </div>
          </div>

          {viewMode === "pmos" ? (
            <div className="space-y-6">
              <p className="font-serif text-lg sm:text-xl text-[#1C1F1D] leading-relaxed max-w-3xl">
                <strong>PMOS (Polyendocrine Metabolic Ovarian Syndrome)</strong>{" "}
                reflects the May 2026 international consensus recognizing that
                insulin signaling, endocrine balance, and cognitive clarity are
                central to the condition—not secondary side effects.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50]">
                    Whole-Body Scope
                  </p>
                  <p className="font-serif text-base font-medium text-[#1C1F1D]">
                    Endocrine + Metabolic
                  </p>
                  <p className="text-xs text-[#5A605C] leading-relaxed">
                    Connects insulin resistance, afternoon energy crashes, and
                    androgen balance across all life stages—including 45+.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50]">
                    Cognitive Research
                  </p>
                  <p className="font-serif text-base font-medium text-[#1C1F1D]">
                    Brain Fog &amp; Recall
                  </p>
                  <p className="text-xs text-[#5A605C] leading-relaxed">
                    Informed by UCSF <em>Neurology</em> findings linking
                    metabolic and hormonal shifts to measurable attention and
                    memory drag.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50]">
                    Better Consults
                  </p>
                  <p className="font-serif text-base font-medium text-[#1C1F1D]">
                    Actionable Lab Panels
                  </p>
                  <p className="text-xs text-[#5A605C] leading-relaxed">
                    Shifts doctor visits beyond period dates toward fasting
                    insulin, HbA1c, thyroid, and androgen baselines.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="font-serif text-lg sm:text-xl text-[#1C1F1D] leading-relaxed max-w-3xl">
                <strong>PCOS (Polycystic Ovary Syndrome)</strong> named the
                condition after ovarian follicles on ultrasound—causing decades
                of confusion for patients without cysts and overlooking brain
                fog and metabolic fatigue.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7F7B]">
                    Misleading Name
                  </p>
                  <p className="font-serif text-base font-medium text-[#1C1F1D]">
                    Not Actual Cysts
                  </p>
                  <p className="text-xs text-[#5A605C] leading-relaxed">
                    Many people meet diagnostic criteria without polycystic
                    ovaries, while others with ovarian follicles have no
                    syndrome at all.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7F7B]">
                    Blind Spot
                  </p>
                  <p className="font-serif text-base font-medium text-[#1C1F1D]">
                    Cycle-Only Apps
                  </p>
                  <p className="text-xs text-[#5A605C] leading-relaxed">
                    Traditional trackers only log bleeding days, leaving sleep
                    disruption, sugar cravings, and word-finding slips
                    untracked.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7F7B]">
                    Midlife Gap
                  </p>
                  <p className="font-serif text-base font-medium text-[#1C1F1D]">
                    Stops at Menopause
                  </p>
                  <p className="text-xs text-[#5A605C] leading-relaxed">
                    Focusing purely on ovulation left women over 45 without
                    clear tracking for persistent metabolic and cognitive
                    patterns.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between text-xs text-[#5A605C]">
            <span>Educational companion · Not a diagnostic tool</span>
            <Link
              href="/guide"
              className="font-semibold text-[#2F5D50] hover:underline inline-flex items-center gap-1"
            >
              View recommended labs &amp; daily habits <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}