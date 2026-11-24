"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Square, ArrowRight } from "lucide-react";

const RESET_HABITS = [
  {
    id: "protein",
    title: "25–30g Protein Within 60 Mins of Waking",
    detail:
      "Blunts morning glucose spikes that often trigger mid-morning cognitive fog.",
  },
  {
    id: "walk",
    title: "10-Minute Post-Meal Walk",
    detail:
      "Helps skeletal muscle clear post-meal glucose without needing a heavy insulin surge.",
  },
  {
    id: "sleep",
    title: "Consistent 7.5h+ Sleep Window",
    detail:
      "Even one <6.5h night measurably lowers next-day insulin sensitivity and working memory.",
  },
  {
    id: "hydrate",
    title: "Electrolytes & Water Before Caffeine",
    detail:
      "Reduces cortisol-driven jitters and afternoon energy crashes.",
  },
];

const LAB_PANELS = [
  {
    name: "Fasting Insulin & HOMA-IR",
    why: "Catches early insulin resistance years before fasting glucose or HbA1c turns abnormal.",
  },
  {
    name: "HbA1c & Lipid Profile",
    why: "Tracks 90-day glycemic stability and metabolic cardiovascular markers.",
  },
  {
    name: "Total & Free Testosterone + DHEA-S",
    why: "Evaluates ovarian vs. adrenal androgen activity across reproductive and 45+ stages.",
  },
  {
    name: "TSH, Free T4, Vitamin D & B12",
    why: "Rules out overlapping thyroid or micronutrient causes of fatigue and brain fog.",
  },
];

export default function GuidePage() {
  const [checked, setChecked] = useState<string[]>(["protein"]);

  const toggle = (id: string) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1F1D]">
      <header className="border-b border-[#E3DDD2] bg-[#F7F5F0]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2F5D50]" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Clarity
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-xs font-medium text-[#5A605C]">
            <Link href="/" className="hover:text-[#1C1F1D] transition">
              Home
            </Link>
            <Link href="/track" className="hover:text-[#1C1F1D] transition">
              Tracker
            </Link>
            <Link
              href="/track"
              className="px-4 py-1.5 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] font-semibold transition"
            >
              Open Log
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="border-b border-[#E3DDD2] pb-8 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50]">
            PMOS Action Toolkit
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal">
            Daily clarity habits &amp; clinical lab guide
          </h1>
          <p className="text-sm sm:text-base text-[#4F5551] max-w-2xl leading-relaxed">
            Practical, low-friction habits to steady energy and focus, paired
            with the core endocrine and metabolic labs worth discussing with a
            doctor—including across perimenopause and age 45+.
          </p>
        </div>

        {/* Interactive Daily Reset Checklist */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-normal">
              Daily Brain-Fog Reset ({checked.length}/{RESET_HABITS.length})
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {RESET_HABITS.map((h) => {
              const isDone = checked.includes(h.id);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggle(h.id)}
                  className={`text-left p-5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                    isDone
                      ? "bg-white border-[#2F5D50] shadow-2xs"
                      : "bg-white/70 border-[#E3DDD2] hover:border-[#1C1F1D]"
                  }`}
                >
                  {isDone ? (
                    <CheckSquare className="w-5 h-5 text-[#2F5D50] shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-[#8B918D] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#1C1F1D]">
                      {h.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5A605C] mt-1 leading-relaxed">
                      {h.detail}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Lab Screening Guide */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-normal">
            Key PMOS &amp; Metabolic Screening Panels
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {LAB_PANELS.map((lab) => (
              <div
                key={lab.name}
                className="p-5 rounded-2xl bg-white/80 border border-[#E3DDD2] space-y-1.5"
              >
                <h3 className="font-serif text-lg font-medium text-[#1C1F1D]">
                  {lab.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#5A605C] leading-relaxed">
                  {lab.why}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-2">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0] text-xs font-semibold tracking-wide transition"
          >
            Go to Daily Logger <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}