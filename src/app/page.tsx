"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  ArrowRight,
  Sparkles,
  Zap,
  Moon,
  Activity,
  Lock,
  FileText,
  CheckCircle2,
  Stethoscope,
  RefreshCw,
} from "lucide-react";

const WHY_ITEMS = [
  {
    id: "cognitive",
    title: "COGNITIVE TRACKING",
    desc: "Log brain fog, focus, and verbal recall alongside your cycle—not just period dates.",
  },
  {
    id: "private",
    title: "100% PRIVATE & OFFLINE",
    desc: "Zero accounts, zero cloud servers. Your health data stays locked on your device.",
  },
  {
    id: "science",
    title: "2026 PMOS SCIENCE",
    desc: "Built around The Lancet rename and the 2024 UCSF Neurology brain-health study.",
  },
  {
    id: "doctor",
    title: "1-CLICK DOCTOR BRIEF",
    desc: "Print a clean summary of your patterns to bring to your gynecologist or endocrinologist.",
  },
];

const QUICK_VIBE = [
  {
    level: "Sharp & Clear",
    emoji: "⚡",
    tip: "Great baseline day. Log your sleep & meals today so you know what keeps your brain clear.",
  },
  {
    level: "Mild Fog",
    emoji: "☁️",
    tip: "Totally common with PMOS metabolic dips. A 15-min walk + protein snack often resets focus.",
  },
  {
    level: "Heavy Fog",
    emoji: "🌫️",
    tip: "Be gentle with yourself today. Track your sleep hours and cycle day to spot if this repeats.",
  },
];

export default function HomePage() {
  const [activeWhy, setActiveWhy] = useState("cognitive");
  const [selectedVibe, setSelectedVibe] = useState<number>(1);
  const [showNewName, setShowNewName] = useState(true);
  const [activeTile, setActiveTile] = useState<string>("Brain Fog");

  const tileInfo: Record<string, string> = {
    "Brain Fog": "Track daily mental clarity from 1 (clear) to 5 (heavy fog).",
    "Metabolic": "Spot sugar crashes, fatigue, and energy dips after meals.",
    "Sleep": "See how <7 hours of sleep amplifies next-day cognitive load.",
  };

  return (
    <div className="min-h-screen bg-[#160a24] text-[#1e1033] selection:bg-violet-300 selection:text-violet-950 overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-[#160a24]/85 backdrop-blur-xl border-b border-violet-500/20">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tight text-white text-lg">
              CLARITY
            </span>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/30">
              PMOS Companion
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="#rename"
              className="hidden md:inline text-xs font-bold uppercase tracking-wider text-violet-200/80 hover:text-white transition"
            >
              PCOS → PMOS
            </a>
            <a
              href="#brain"
              className="hidden md:inline text-xs font-bold uppercase tracking-wider text-violet-200/80 hover:text-white transition"
            >
              Brain Link
            </a>
            <Link
              href="/guide"
              className="hidden md:inline text-xs font-bold uppercase tracking-wider text-violet-200/80 hover:text-white transition"
            >
              Toolkit
            </Link>
            <Link
              href="/track"
              className="px-5 py-2.5 rounded-full bg-[#ede9fe] hover:bg-white text-[#2e1065] text-xs font-black uppercase tracking-wider transition shadow-lg"
            >
              Open Tracker →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO: 3-CARD INTERACTIVE SHOWCASE */}
      <section className="relative pt-12 pb-24 px-4 sm:px-6">
        {/* Soft Violet Ambient Glow */}
        <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/25 blur-[130px]" />

        <div className="relative max-w-6xl mx-auto">
          {/* Top Pill */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              Interactive PMOS Companion · Tap any card below
            </div>
          </div>

          {/* 3-Card Layout */}
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            {/* LEFT TILTED CARD: WHY CLARITY? (Interactive Stacked List) */}
            <motion.div
              whileHover={{ rotate: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="lg:col-span-4 lg:-rotate-3 bg-[#f3eeff] rounded-[2rem] p-6 shadow-2xl border-2 border-violet-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-violet-900 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-violet-600" /> CLARITY
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-200 text-violet-900">
                  Tap to explore
                </span>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-[#2e1065] mb-4">
                Why Choose Us
              </h2>

              <div className="space-y-2.5">
                {WHY_ITEMS.map((item) => {
                  const isActive = activeWhy === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveWhy(item.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                        isActive
                          ? "bg-[#c4b5fd] border-[#4c1d95] shadow-md"
                          : "bg-white/80 border-violet-200 hover:border-violet-400"
                      }`}
                    >
                      <div className="text-xs font-black uppercase tracking-wide text-[#2e1065]">
                        {item.title}
                      </div>
                      <p className="text-xs text-violet-950/80 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* CENTER MAIN CARD: HERO + 2x2 INTERACTIVE GRID + CIRCULAR CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-4 bg-[#e9d5ff] rounded-[2.2rem] p-7 shadow-2xl border-2 border-violet-300 relative z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-black uppercase tracking-wider text-[#2e1065] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-700" /> MAY 2026 UPDATE
                </span>
                <span className="text-[10px] font-black uppercase text-violet-800">
                  PCOS → PMOS
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-[0.95] text-white drop-shadow-[0_2px_0_rgba(76,29,149,0.45)] mb-4">
                CLARITY
                <br />
                FOR PMOS
              </h1>

              <p className="text-xs sm:text-sm font-medium text-[#2e1065]/90 leading-relaxed mb-6">
                Understand your body. Protect your mind. Track brain fog, focus,
                and metabolic signals in 30 seconds a day.
              </p>

              {/* 2x2 Playful Grid (3 Interactive Tiles + 1 Circular CTA) */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setActiveTile("Brain Fog")}
                  className={`aspect-square rounded-3xl p-4 flex flex-col justify-between text-left transition cursor-pointer border-2 ${
                    activeTile === "Brain Fog"
                      ? "bg-[#7c3aed] text-white border-[#2e1065] scale-[1.02]"
                      : "bg-[#f5f3ff] text-[#2e1065] border-violet-300 hover:bg-white"
                  }`}
                >
                  <Brain className="w-7 h-7" />
                  <div>
                    <div className="text-xs font-black uppercase">Brain Fog</div>
                    <div className="text-[10px] opacity-80">1–5 Daily</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTile("Metabolic")}
                  className={`aspect-square rounded-3xl p-4 flex flex-col justify-between text-left transition cursor-pointer border-2 ${
                    activeTile === "Metabolic"
                      ? "bg-[#6d28d9] text-white border-[#2e1065] scale-[1.02]"
                      : "bg-[#ddd6fe] text-[#2e1065] border-violet-300 hover:bg-violet-200"
                  }`}
                >
                  <Zap className="w-7 h-7" />
                  <div>
                    <div className="text-xs font-black uppercase">Metabolic</div>
                    <div className="text-[10px] opacity-80">Energy & Mood</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTile("Sleep")}
                  className={`aspect-square rounded-3xl p-4 flex flex-col justify-between text-left transition cursor-pointer border-2 ${
                    activeTile === "Sleep"
                      ? "bg-[#5b21b6] text-white border-[#2e1065] scale-[1.02]"
                      : "bg-[#c4b5fd] text-[#2e1065] border-violet-300 hover:bg-violet-300"
                  }`}
                >
                  <Moon className="w-7 h-7" />
                  <div>
                    <div className="text-xs font-black uppercase">Sleep</div>
                    <div className="text-[10px] opacity-80">Pattern Sync</div>
                  </div>
                </button>

                {/* Circular CTA Button */}
                <Link
                  href="/track"
                  className="aspect-square rounded-full bg-[#3b0764] hover:bg-[#4c1d95] text-white flex flex-col items-center justify-center text-center p-3 shadow-xl hover:scale-105 transition"
                >
                  <span className="text-xs font-black uppercase tracking-wider leading-tight">
                    START
                    <br />
                    TRACKING
                  </span>
                  <ArrowRight className="w-4 h-4 mt-1.5" />
                </Link>
              </div>

              {/* Dynamic Micro-tooltip for tapped tile */}
              <div className="p-3 rounded-2xl bg-white/80 border border-violet-300 text-[11px] font-semibold text-[#2e1065]">
                <span className="font-black uppercase text-violet-700">
                  {activeTile}:
                </span>{" "}
                {tileInfo[activeTile]}
              </div>
            </motion.div>

            {/* RIGHT TILTED CARD: INTERACTIVE 30-SEC BRAIN FOG CHECK */}
            <motion.div
              whileHover={{ rotate: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="lg:col-span-4 lg:rotate-3 bg-[#f3eeff] rounded-[2rem] p-6 shadow-2xl border-2 border-violet-200 overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-violet-900">
                  LIVE CHECK-IN
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-200 text-violet-900">
                  Try it now
                </span>
              </div>

              {/* Cloud-style white section */}
              <div className="bg-white rounded-3xl p-5 border-2 border-violet-200 mb-4">
                <h3 className="text-xl font-black uppercase tracking-tight text-[#2e1065] leading-tight mb-2">
                  HOW&apos;S YOUR HEADSPACE RIGHT NOW?
                </h3>
                <p className="text-xs text-violet-950/70 mb-4">
                  Tap one to see how Clarity turns daily feelings into useful patterns:
                </p>

                <div className="space-y-2">
                  {QUICK_VIBE.map((vibe, idx) => (
                    <button
                      key={vibe.level}
                      onClick={() => setSelectedVibe(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                        selectedVibe === idx
                          ? "bg-[#7c3aed] text-white border-[#4c1d95]"
                          : "bg-violet-50 text-[#2e1065] border-violet-200 hover:border-violet-400"
                      }`}
                    >
                      <span>
                        {vibe.emoji} {vibe.level}
                      </span>
                      {selectedVibe === idx && (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Tailored Feedback */}
              <div className="p-4 rounded-2xl bg-[#ddd6fe] border-2 border-violet-300">
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-900 mb-1">
                  Clarity Insight
                </div>
                <p className="text-xs font-medium text-[#2e1065] leading-relaxed mb-3">
                  {QUICK_VIBE[selectedVibe].tip}
                </p>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-violet-900 hover:text-violet-700"
                >
                  Log this in Tracker <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE PCOS -> PMOS SWITCHER */}
      <section id="rename" className="py-20 px-5 bg-[#220e38] border-y border-violet-500/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-violet-300">
              The Lancet Global Consensus · May 2026
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-2">
              Tap to see what changed
            </h2>
          </div>

          <div className="bg-[#f3eeff] rounded-[2.2rem] p-6 sm:p-10 border-2 border-violet-300 shadow-2xl">
            {/* Interactive Toggle Pill */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1.5 rounded-full bg-violet-200 border border-violet-300">
                <button
                  onClick={() => setShowNewName(false)}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    !showNewName
                      ? "bg-[#3b0764] text-white shadow"
                      : "text-violet-900 hover:text-violet-950"
                  }`}
                >
                  Old Name (PCOS)
                </button>
                <button
                  onClick={() => setShowNewName(true)}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    showNewName
                      ? "bg-[#7c3aed] text-white shadow"
                      : "text-violet-900 hover:text-violet-950"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Name (PMOS)
                </button>
              </div>
            </div>

            {showNewName ? (
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-block px-3 py-1 rounded-full bg-violet-600 text-white text-[11px] font-black uppercase tracking-wider mb-3">
                  Official Name · May 2026
                </div>
                <h3 className="text-4xl sm:text-5xl font-black text-[#2e1065] mb-2">
                  PMOS
                </h3>
                <p className="text-base font-bold text-violet-700 mb-4">
                  Polyendocrine Metabolic Ovarian Syndrome
                </p>
                <p className="text-sm text-violet-950/80 leading-relaxed">
                  Reflects the true whole-body nature of the condition: it connects{" "}
                  <strong>endocrine hormones</strong>,{" "}
                  <strong>metabolic health</strong>, and{" "}
                  <strong>ovarian function</strong>—helping young women get earlier, better screening.
                </p>
              </div>
            ) : (
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-block px-3 py-1 rounded-full bg-zinc-300 text-zinc-800 text-[11px] font-black uppercase tracking-wider mb-3">
                  Outdated Name
                </div>
                <h3 className="text-4xl sm:text-5xl font-black text-zinc-500 line-through mb-2">
                  PCOS
                </h3>
                <p className="text-base font-bold text-zinc-600 mb-4">
                  Polycystic Ovary Syndrome
                </p>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  Misleadingly focused only on ovarian cysts—even though many women with the condition don&apos;t have cysts—while downplaying insulin resistance, energy crashes, and metabolic health.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: COGNITIVE LINK (2024 UCSF STUDY) */}
      <section id="brain" className="py-20 px-5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-6 items-stretch">
          <div className="md:col-span-7 bg-[#e9d5ff] rounded-[2rem] p-8 border-2 border-violet-300 flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#3b0764] text-white text-[11px] font-black uppercase tracking-wider mb-4">
                2024 UCSF · Neurology Study
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight text-[#2e1065] mb-4">
                The Brain-Body Connection
              </h2>
              <p className="text-sm text-[#2e1065]/90 leading-relaxed mb-6">
                Long-term research from UCSF found that women with PMOS had slightly lower scores on midlife tests of{" "}
                <strong>memory, attention, and verbal fluency</strong>, alongside subtle white-matter differences on MRI scans.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/85 border-2 border-violet-300 text-xs text-[#2e1065] leading-relaxed">
              <strong className="uppercase text-violet-800">Important:</strong>{" "}
              This shows a <strong>mild association</strong>—it does <em>not</em> prove PMOS causes memory loss. Tracking sleep, stress, and brain fog early empowers you to protect long-term brain health.
            </div>
          </div>

          <div className="md:col-span-5 bg-[#f3eeff] rounded-[2rem] p-8 border-2 border-violet-200 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black uppercase text-[#2e1065] mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-violet-700" />
                Built for Real Life
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm font-medium text-[#2e1065]/85">
                <li className="flex items-start gap-2.5">
                  <Activity className="w-4 h-4 text-violet-700 mt-0.5 shrink-0" />
                  <span>Visual charts comparing brain fog, focus, and energy.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-violet-700 mt-0.5 shrink-0" />
                  <span>100% offline local storage—zero tracking or logins.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-violet-700 mt-0.5 shrink-0" />
                  <span>Print-ready Doctor Brief + India NFHS-5 / MoHFW screening checklist.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/track"
              className="mt-8 w-full py-4 rounded-full bg-[#3b0764] hover:bg-[#581c87] text-white text-center text-xs font-black uppercase tracking-wider transition shadow-lg"
            >
              Launch Interactive Tracker →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-violet-500/20 py-10 px-6 text-center text-xs text-violet-300/70">
        <p>
          Clarity is an educational & amp; self-tracking tool—not medical advice or diagnosis.
        </p>
        <p className="mt-2 text-violet-400/60">
          Sources: The Lancet (May 2026) · Neurology / UCSF (2024)
        </p>
      </footer>
    </div>
  );
}