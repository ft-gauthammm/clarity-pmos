"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, BookOpen, ExternalLink } from "lucide-react";

const HABITS = [
  {
    id: "protein",
    title: "25–30g Protein-First Breakfast",
    why: "Higher-protein morning meals can help blunt post-meal glucose spikes and reduce mid-morning energy dips.",
  },
  {
    id: "walk",
    title: "10-Minute Post-Meal Walk",
    why: "Light muscle activity after meals supports skeletal muscle glucose uptake without requiring intense workouts.",
  },
  {
    id: "sleep",
    title: "Consistent 7.5–8h Sleep Window",
    why: "Even short-term sleep restriction is associated with reduced insulin sensitivity and slower working memory the next day.",
  },
  {
    id: "hydration",
    title: "500ml Water Before Morning Caffeine",
    why: "Rehydrating before coffee may help minimize morning jitteriness and sharp mid-afternoon energy crashes.",
  },
];

const LAB_PANELS = [
  {
    category: "Metabolic & Glycemic",
    tests: "Fasting Insulin, Fasting Glucose, HbA1c, Lipid Panel",
    note: "Standard fasting glucose can look normal even when fasting insulin is elevated—ask your clinician if HOMA-IR or fasting insulin is appropriate.",
  },
  {
    category: "Endocrine & Androgens",
    tests: "Total & Free Testosterone, SHBG, DHEA-S, LH / FSH",
    note: "Helps clarify androgen excess and endocrine patterns behind irregular cycles, fatigue, or mood shifts.",
  },
  {
    category: "Thyroid & Micronutrients",
    tests: "TSH, Free T4, Vitamin B12, Vitamin D (25-OH), Ferritin",
    note: "Subclinical hypothyroidism, low ferritin, and B12/Vitamin D insufficiency frequently overlap with PMOS brain fog.",
  },
];

const SOURCES = [
  {
    title: "Huddleston HG et al., Neurology (2024)",
    detail:
      "Observational cohort study reporting lower midlife cognitive performance (attention, memory, verbal fluency) in participants with PCOS.",
  },
  {
    title: "International Evidence-Based Guideline for the Assessment and Management of PCOS (2023/2026 Updates)",
    detail:
      "Clinical consensus guiding metabolic screening (oral glucose tolerance, HbA1c, lipids), lifestyle foundations, and mental/cognitive health awareness.",
  },
  {
    title: "Ministry of Health & Family Welfare (MoHFW) & NFHS-5 India Reference Data",
    detail:
      "Public health nutrition, anemia/ferritin screening, and non-communicable metabolic risk frameworks informing baseline micronutrient and glycemic checklists.",
  },
];

const HABIT_KEY = "clarity_pmos_habits_v5";

export default function GuidePage() {
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HABIT_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const toggleHabit = (id: string) => {
    const next = checked.includes(id)
      ? checked.filter((h) => h !== id)
      : [...checked, id];
    setChecked(next);
    localStorage.setItem(HABIT_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1F1D]">
      {/* Top Bar */}
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
              className="px-4 py-1.5 rounded-full bg-[#1C1F1D] text-[#F7F5F0] hover:bg-[#2F5D50] transition"
            >
              Open Log
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-14">
        {/* Header */}
        <section className="space-y-3 border-b border-[#E3DDD2] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50]">
            Evidence-Aligned Action Toolkit
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-tight">
            Supporting metabolic &amp; cognitive clarity
          </h1>
          <p className="text-sm text-[#5A605C] max-w-2xl leading-relaxed">
            Practical, low-friction daily habits and clinical lab conversations
            grounded in endocrine and public-health literature. Always review lab
            orders and lifestyle changes with a qualified clinician.
          </p>
        </section>

        {/* Interactive Daily Habits Checklist */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-normal">
              Daily Focus-Support Habits
            </h2>
            <span className="text-xs font-semibold text-[#2F5D50]">
              {checked.length}/{HABITS.length} completed today
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {HABITS.map((habit) => {
              const done = checked.includes(habit.id);
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className={`text-left p-5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                    done
                      ? "bg-[#2F5D50]/10 border-[#2F5D50]"
                      : "bg-white/85 border-[#E3DDD2] hover:border-[#1C1F1D]"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2F5D50] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#9AA09C] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-serif text-lg font-medium text-[#1C1F1D]">
                      {habit.title}
                    </p>
                    <p className="text-xs text-[#5A605C] leading-relaxed">
                      {habit.why}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Clinical Lab Guide */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-normal">
            Lab Panels to Discuss With Your Doctor
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {LAB_PANELS.map((panel) => (
              <div
                key={panel.category}
                className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 space-y-2.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50]">
                  {panel.category}
                </p>
                <p className="font-serif text-base font-medium text-[#1C1F1D]">
                  {panel.tests}
                </p>
                <p className="text-xs text-[#5A605C] leading-relaxed">
                  {panel.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Clinical References & Citations */}
        <section className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2F5D50]">
            <BookOpen className="w-3.5 h-3.5" /> Clinical References &amp; Public Health Grounding
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {SOURCES.map((src) => (
              <div
                key={src.title}
                className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] space-y-1.5"
              >
                <p className="font-serif text-sm font-medium text-[#1C1F1D] flex items-start justify-between gap-2">
                  <span>{src.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5A605C] shrink-0 mt-0.5" />
                </p>
                <p className="text-xs text-[#5A605C] leading-relaxed">
                  {src.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#6E7570] pt-1">
            Medical Disclaimer: Clarity provides educational health information and personal tracking tools only. It does not provide medical advice, diagnosis, or treatment recommendations.
          </p>
        </section>
      </main>
    </div>
  );
}