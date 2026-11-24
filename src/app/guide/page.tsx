"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Circle, BookOpen, ExternalLink } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const HABITS = [
  {
    id: "protein",
    title: "Protein-First Breakfast",
    why: "Prioritizing protein at breakfast is commonly used in metabolic routines to help moderate post-meal glucose responses and mid-morning energy dips.",
  },
  {
    id: "walk",
    title: "Short Post-Meal Walk",
    why: "Light movement after meals is associated with improved postprandial glucose handling in general and metabolic cohorts.",
  },
  {
    id: "sleep",
    title: "Consistent Sleep Window",
    why: "Irregular or short sleep is associated with next-day fatigue and cognitive drag in general and PCOS/PMOS observational studies.",
  },
  {
    id: "hydration",
    title: "Morning Water Before Caffeine",
    why: "Starting the day with water is a low-friction hydration habit; individual responses to morning caffeine vary.",
  },
];

const LAB_PANELS = [
  {
    category: "Metabolic & Glycemic",
    tests: "Fasting Insulin, Fasting Glucose, HbA1c, Lipid Panel",
    note: "Discuss with a clinician whether fasting glucose, HbA1c, lipid screening, or additional metabolic markers fit your personal history.",
  },
  {
    category: "Endocrine & Androgens",
    tests: "Total & Free Testosterone, SHBG, DHEA-S, LH / FSH",
    note: "Clinicians may evaluate androgen and endocrine markers alongside cycle history and symptoms to rule out other causes.",
  },
  {
    category: "Thyroid & Micronutrients",
    tests: "TSH, Free T4, Vitamin B12, Vitamin D (25-OH), Ferritin",
    note: "Clinicians often check thyroid function, iron/ferritin, and common micronutrient levels when evaluating persistent fatigue.",
  },
];

const SOURCES = [
  {
    title: "Huddleston HG et al., Neurology (2024)",
    url: "https://doi.org/10.1212/WNL.0000000000208104",
    detail:
      "Observational CARDIA cohort study (Huddleston, Jaswa, Casaletto, Neuhaus, Kim, Wellons, Launer, Yaffe) reporting lower midlife cognitive scores across memory, attention, and processing speed in participants with PCOS.",
  },
  {
    title: "International Evidence-Based Guideline for PCOS (2023)",
    url: "https://academic.oup.com/jcem/article/108/10/2447/7242360",
    detail:
      "International evidence-based recommendations covering assessment, lifestyle support, metabolic risk evaluation, and psychological well-being in PCOS.",
  },
  {
    title: "NFHS-5 India Factsheet (MoHFW)",
    url: "https://main.mohfw.gov.in/",
    detail:
      "National family health survey data providing general population health context in India; not a clinical diagnostic protocol for PMOS.",
  },
];

const HABIT_KEY = "clarity_pmos_habits_v6";

export default function GuidePage() {
  const [todayKey, setTodayKey] = useState("");
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    const key = format(new Date(), "yyyy-MM-dd");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayKey(key);
    try {
      const raw = localStorage.getItem(HABIT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === key && Array.isArray(parsed.ids)) {
          setChecked(parsed.ids);
        } else {
          setChecked([]);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleHabit = (id: string) => {
    const next = checked.includes(id)
      ? checked.filter((h) => h !== id)
      : [...checked, id];
    setChecked(next);
    const key = todayKey || format(new Date(), "yyyy-MM-dd");
    localStorage.setItem(HABIT_KEY, JSON.stringify({ date: key, ids: next }));
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#111412] text-[#1C1F1D] dark:text-[#ECEAE4] transition-colors">
      <header className="border-b border-[#E3DDD2] dark:border-[#252B27] bg-[#F7F5F0]/90 dark:bg-[#111412]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2F5D50] dark:bg-[#52A88E]" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Clarity
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 text-xs font-medium text-[#5A605C] dark:text-[#A4AAA6]">
            <Link href="/" className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] transition">
              Home
            </Link>
            <Link href="/track" className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] transition">
              Tracker
            </Link>
            <ThemeToggle />
            <Link
              href="/track"
              className="px-4 py-1.5 rounded-full bg-[#1C1F1D] dark:bg-[#52A88E] text-[#F7F5F0] dark:text-[#0F1311] hover:bg-[#2F5D50] dark:hover:bg-[#66B89F] transition"
            >
              Open Log
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-14">
        <section className="space-y-3 border-b border-[#E3DDD2] dark:border-[#252B27] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50] dark:text-[#66B89F]">
            Evidence-Aligned Action Toolkit
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-tight">
            Supporting metabolic &amp; cognitive clarity
          </h1>
          <p className="text-sm text-[#5A605C] dark:text-[#A4AAA6] max-w-2xl leading-relaxed">
            General daily habits and discussion topics for medical visits. This
            tool is educational only and does not replace individualized clinical
            advice.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-normal">
              Daily Focus-Support Habits
            </h2>
            <span className="text-xs font-semibold text-[#2F5D50] dark:text-[#66B89F]">
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
                  aria-pressed={done}
                  onClick={() => toggleHabit(habit.id)}
                  className={`text-left p-5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                    done
                      ? "bg-[#2F5D50]/10 dark:bg-[#52A88E]/15 border-[#2F5D50] dark:border-[#52A88E]"
                      : "bg-white/85 dark:bg-[#181D1A] border-[#E3DDD2] dark:border-[#252B27] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4]"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2F5D50] dark:text-[#66B89F] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#9AA09C] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-serif text-lg font-medium">
                      {habit.title}
                    </p>
                    <p className="text-xs text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
                      {habit.why}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-normal">
            Lab Panels to Discuss With Your Doctor
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {LAB_PANELS.map((panel) => (
              <div
                key={panel.category}
                className="bg-white/85 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] rounded-2xl p-6 space-y-2.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50] dark:text-[#66B89F]">
                  {panel.category}
                </p>
                <p className="font-serif text-base font-medium">
                  {panel.tests}
                </p>
                <p className="text-xs text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
                  {panel.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/85 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2F5D50] dark:text-[#66B89F]">
            <BookOpen className="w-3.5 h-3.5" /> Reference Sources
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {SOURCES.map((src) => (
              <a
                key={src.title}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4] transition space-y-1.5 block"
              >
                <p className="font-serif text-sm font-medium flex items-start justify-between gap-2">
                  <span>{src.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5A605C] dark:text-[#A4AAA6] shrink-0 mt-0.5" />
                </p>
                <p className="text-xs text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
                  {src.detail}
                </p>
              </a>
            ))}
          </div>
          <p className="text-[11px] text-[#6E7570] dark:text-[#8E9691] pt-1">
            Disclaimer: Educational information and personal logging only; not
            medical diagnosis or treatment advice.
          </p>
        </section>
      </main>
    </div>
  );
}