"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  ArrowLeft,
  CheckCircle2,
  Circle,
  FlaskConical,
  Sparkles,
  Sun,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const RESET_HABITS = [
  {
    id: "protein",
    title: "Protein-First Breakfast",
    desc: "Eat protein + fiber before carbs to prevent mid-morning blood-sugar spikes and brain fog.",
    tag: "Metabolic",
  },
  {
    id: "walk",
    title: "15-Min Post-Meal Walk",
    desc: "Light movement after lunch or dinner helps muscles absorb glucose and sharpens afternoon focus.",
    tag: "Energy",
  },
  {
    id: "sleep",
    title: "7.5+ Hours Consistent Sleep",
    desc: "Short sleep (<7h) strongly amplifies PMOS cognitive fatigue and next-day verbal recall dips.",
    tag: "Cognitive",
  },
  {
    id: "hydrate",
    title: "2L Water + Electrolytes",
    desc: "Even mild dehydration mimics hormonal brain fog and triggers afternoon headaches.",
    tag: "Baseline",
  },
  {
    id: "screen",
    title: "20-Min Deep-Focus Blocks",
    desc: "On heavy fog days, work in short sprints with 5-minute eyes-off-screen resets.",
    tag: "Focus",
  },
];

const LAB_PANELS = [
  {
    name: "HbA1c & Fasting Insulin",
    category: "Metabolic Core",
    why: "Checks for early insulin resistance—the #1 hidden driver of PMOS energy crashes and brain fog, even when fasting glucose looks normal.",
  },
  {
    name: "Thyroid Panel (TSH, Free T4)",
    category: "Endocrine",
    why: "Hypothyroidism frequently overlaps with PMOS and directly causes fatigue, sluggish memory, and irregular cycles.",
  },
  {
    name: "Androgen Panel (Free & Total Testosterone, DHEA-S)",
    category: "Hormonal",
    why: "Evaluates hormonal drivers behind acne, hair thinning, and irregular ovulation.",
  },
  {
    name: "Vitamin B12, Vitamin D & Ferritin",
    category: "Cognitive Support",
    why: "Deficiencies are extremely common in young Indian women (NFHS-5) and can worsen brain fog and low mood.",
  },
  {
    name: "Fasting Lipid Profile",
    category: "Long-Term Health",
    why: "Recommended by global PMOS guidelines to monitor cardiovascular and metabolic health early.",
  },
];

export default function GuidePage() {
  const [checked, setChecked] = useState<string[]>(["protein"]);

  const toggleHabit = (id: string) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const progress = Math.round((checked.length / RESET_HABITS.length) * 100);

  return (
    <div className="min-h-screen bg-[#160a24] text-[#1e1033] pb-20 selection:bg-violet-300 selection:text-violet-950">
      {/* Top Navbar */}
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
                PMOS Toolkit
              </span>
            </div>
          </div>

          <Link
            href="/track"
            className="px-4 py-2 rounded-full bg-[#e9d5ff] hover:bg-white text-[#2e1065] text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
          >
            Open Tracker <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-[11px] font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Evidence-Based Action Guide
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Brain &amp; Body Toolkit
          </h1>
          <p className="text-sm text-violet-200/80 mt-3">
            Practical daily habits to clear brain fog and the exact screening panels to discuss with your doctor.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: INTERACTIVE BRAIN-FOG RESET CHECKLIST */}
          <section className="lg:col-span-5 p-6 sm:p-7 rounded-[2rem] bg-[#e9d5ff] border-2 border-violet-300 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#2e1065] flex items-center gap-2">
                <Sun className="w-5 h-5 text-violet-700" />
                Daily Fog Reset
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-[#3b0764] text-white text-xs font-black">
                {progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-violet-300/70 overflow-hidden mb-5">
              <div
                className="h-full bg-[#7c3aed] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-2.5">
              {RESET_HABITS.map((habit) => {
                const isDone = checked.includes(habit.id);
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-start gap-3 cursor-pointer ${
                      isDone
                        ? "bg-[#7c3aed] border-[#3b0764] text-white shadow-md"
                        : "bg-white/90 border-violet-200 text-[#2e1065] hover:border-violet-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wide">
                          {habit.title}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isDone
                              ? "bg-white/20 text-white"
                              : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {habit.tag}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          isDone ? "text-violet-100" : "text-violet-950/75"
                        }`}
                      >
                        {habit.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* RIGHT: PMOS SCREENING & LAB PANELS */}
          <section className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-7 rounded-[2rem] bg-[#f3eeff] border-2 border-violet-300 shadow-2xl">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#2e1065] flex items-center gap-2 mb-1">
                <FlaskConical className="w-5 h-5 text-violet-700" />
                Labs to Discuss With Your Doctor
              </h2>
              <p className="text-xs font-medium text-violet-950/70 mb-5">
                Because PMOS is endocrine + metabolic, an ultrasound alone rarely tells the full story.
              </p>

              <div className="space-y-3">
                {LAB_PANELS.map((lab) => (
                  <div
                    key={lab.name}
                    className="p-4 rounded-2xl bg-white border-2 border-violet-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-black text-[#2e1065]">
                        {lab.name}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                        {lab.category}
                      </span>
                    </div>
                    <p className="text-xs text-violet-950/80 leading-relaxed">
                      {lab.why}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* India Context Card */}
            <div className="p-6 rounded-[2rem] bg-[#3b0764] text-white border-2 border-violet-400/40 shadow-xl">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-violet-300 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-violet-200 mb-1">
                    India Public Health Context (NFHS-5 &amp; MoHFW)
                  </h3>
                  <p className="text-xs text-violet-100/90 leading-relaxed">
                    In India, metabolic and endocrine conditions are frequently under-diagnosed until the late 20s. Early screening for anemia, thyroid health, and blood-sugar regulation during college years makes a major difference in long-term energy and cognitive clarity.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}   