"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { format, subDays, parseISO, differenceInCalendarDays } from "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Printer,
  Download,
  Upload,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  Lock,
  Activity,
  Layers,
  AlertCircle,
} from "lucide-react";
import GamificationBar from "@/components/GamificationBar";
import CognitiveMiniTest from "@/components/CognitiveMiniTest";
import StroopGame from "@/components/StroopGame";

type HormonePhase = "Follicular" | "Ovulatory" | "Luteal" | "Irregular / Suppressed";

interface DailyEntry {
  id: string;
  date: string;
  brainFog: number;
  focus: number;
  energy: number;
  mood: number;
  sleepHours: number;
  cycleDay: string;
  hormonePhase: HormonePhase;
  symptoms: string[];
  triggers: string[];
  notes: string;
  reactionMs?: number;
  stroopScore?: number;
}

interface CognitiveRun {
  date: string;
  reactionMs?: number;
  stroopScore?: number;
}

const HORMONE_PHASES: { label: HormonePhase; color: string; short: string }[] = [
  { label: "Follicular", color: "#4D8B7A", short: "Follicular" },
  { label: "Ovulatory", color: "#D99B26", short: "Ovulatory" },
  { label: "Luteal", color: "#B86B4B", short: "Luteal" },
  { label: "Irregular / Suppressed", color: "#7C858E", short: "Suppressed / Irreg." },
];

const SYMPTOM_OPTIONS = [
  "Afternoon Crash",
  "Sugar Cravings",
  "Word-Finding Slip",
  "Restless Sleep",
  "Bloating",
  "Headache",
  "Steady Energy",
];

const TRIGGER_OPTIONS = [
  "High Stress",
  "Poor Sleep (<6.5h)",
  "Late Meal / High Carb",
  "High Caffeine",
  "Med / Supplement",
  "Post-Meal Walk",
];

const STORAGE_KEY = "clarity_pmos_entries_v6";
const STATS_KEY = "clarity_pmos_stats_v6";

// --- Web Crypto AES-GCM Helpers ---
async function deriveKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPayload(payloadObj: unknown, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(payloadObj))
  );
  const toBase64 = (buf: Uint8Array) =>
    btoa(String.fromCharCode(...Array.from(buf)));
  return JSON.stringify({
    app: "Clarity-PMOS",
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(cipherBuffer)),
  });
}

async function decryptPayload(rawFileText: string, password: string) {
  const parsed = JSON.parse(rawFileText);
  if (!parsed.salt || !parsed.iv || !parsed.ciphertext) {
    throw new Error("Invalid backup file format.");
  }
  const fromBase64 = (b64: string) =>
    Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const salt = fromBase64(parsed.salt);
  const iv = fromBase64(parsed.iv);
  const ciphertext = fromBase64(parsed.ciphertext);
  const key = await deriveKey(password, salt);
  const plainBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plainBuffer));
}

function isValidEntry(item: unknown): item is DailyEntry {
  if (!item || typeof item !== "object") return false;
  const e = item as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    typeof e.brainFog === "number" &&
    e.brainFog >= 1 &&
    e.brainFog <= 10 &&
    typeof e.focus === "number" &&
    e.focus >= 1 &&
    e.focus <= 10 &&
    typeof e.sleepHours === "number"
  );
}

export default function TrackPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [runs, setRuns] = useState<CognitiveRun[]>([]);
  const [xp, setXp] = useState(0);
  const [bestReactionMs, setBestReactionMs] = useState<number | null>(null);
  const [bestStroopScore, setBestStroopScore] = useState<number | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);
  const [formError, setFormError] = useState("");

  // Chart Overlays
  const [showPhaseOverlay, setShowPhaseOverlay] = useState(true);
  const [showReactionOverlay, setShowReactionOverlay] = useState(true);

  // Encrypted Backup Modal/Drawer State
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupPass, setBackupPass] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Client-hydrated dates
  const [todayIso, setTodayIso] = useState("");
  const [date, setDate] = useState("");
  const [printDate, setPrintDate] = useState("");

  // Form State (Unrated nulls prevent accidental junk saves)
  const [brainFog, setBrainFog] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<string>("");
  const [cycleDay, setCycleDay] = useState<string>("");
  const [hormonePhase, setHormonePhase] = useState<HormonePhase>("Follicular");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const now = new Date();
    const iso = format(now, "yyyy-MM-dd");
    setTodayIso(iso);
    setDate((prev) => prev || iso);
    setPrintDate(format(now, "MMM d, yyyy"));

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed.filter(isValidEntry));
      }
      const rawStats = localStorage.getItem(STATS_KEY);
      if (rawStats) {
        const parsed = JSON.parse(rawStats);
        setXp(parsed.xp || 0);
        setBestReactionMs(parsed.bestReactionMs ?? null);
        setBestStroopScore(parsed.bestStroopScore ?? null);
        setRuns(Array.isArray(parsed.runs) ? parsed.runs : []);
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
    nextStroop: number | null,
    nextRuns: CognitiveRun[]
  ) => {
    setXp(nextXp);
    setBestReactionMs(nextMs);
    setBestStroopScore(nextStroop);
    setRuns(nextRuns);
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({
        xp: nextXp,
        bestReactionMs: nextMs,
        bestStroopScore: nextStroop,
        runs: nextRuns,
      })
    );
  };

  const toggleItem = (
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      brainFog === null ||
      focus === null ||
      energy === null ||
      mood === null
    ) {
      setFormError("Please rate all four sliders (Fog, Focus, Energy, Mood) before saving.");
      return;
    }

    const parsedSleep = parseFloat(sleepHours);
    if (isNaN(parsedSleep) || parsedSleep < 0 || parsedSleep > 20) {
      setFormError("Please enter valid sleep hours (e.g. 7.5).");
      return;
    }

    const entryDate = date || todayIso || "2026-01-01";
    const existing = entries.find((item) => item.date === entryDate);

    // Attach any mini-test runs taken BEFORE saving this day's entry
    const sameDayRuns = runs.filter((r) => r.date === entryDate);
    const latestReaction = [...sameDayRuns]
      .reverse()
      .find((r) => typeof r.reactionMs === "number")?.reactionMs;
    const latestStroop = [...sameDayRuns]
      .reverse()
      .find((r) => typeof r.stroopScore === "number")?.stroopScore;

    const newEntry: DailyEntry = {
      id: `${entryDate}-${Date.now()}`,
      date: entryDate,
      brainFog,
      focus,
      energy,
      mood,
      sleepHours: parsedSleep,
      cycleDay: cycleDay.trim() || "N/A",
      hormonePhase,
      symptoms,
      triggers,
      notes,
      reactionMs: latestReaction ?? existing?.reactionMs,
      stroopScore: latestStroop ?? existing?.stroopScore,
    };

    const filtered = entries.filter((item) => item.date !== entryDate);
    persistEntries([...filtered, newEntry]);
    persistStats(xp + 30, bestReactionMs, bestStroopScore, runs);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const recordCognitiveScore = (
    type: "reaction" | "stroop",
    value: number
  ) => {
    const targetDate = date || todayIso || "2026-01-01";
    const nextRuns: CognitiveRun[] = [
      ...runs,
      {
        date: targetDate,
        reactionMs: type === "reaction" ? value : undefined,
        stroopScore: type === "stroop" ? value : undefined,
      },
    ].slice(-60);

    // Also attach immediately if that date's entry already exists
    if (entries.some((e) => e.date === targetDate)) {
      const updatedEntries = entries.map((entry) => {
        if (entry.date !== targetDate) return entry;
        return {
          ...entry,
          reactionMs: type === "reaction" ? value : entry.reactionMs,
          stroopScore: type === "stroop" ? value : entry.stroopScore,
        };
      });
      persistEntries(updatedEntries);
    }

    if (type === "reaction") {
      const nextBest =
        bestReactionMs === null ? value : Math.min(bestReactionMs, value);
      persistStats(xp + 25, nextBest, bestStroopScore, nextRuns);
    } else {
      const nextBest =
        bestStroopScore === null ? value : Math.max(bestStroopScore, value);
      persistStats(xp + 20, bestReactionMs, nextBest, nextRuns);
    }
  };

  const loadDemoData = () => {
    if (entries.length > 0) {
      const ok = window.confirm(
        `This will replace your ${entries.length} existing logged entry(s) with 7 sample days. Continue?`
      );
      if (!ok) return;
    }

    const baseDate = todayIso ? new Date(`${todayIso}T12:00:00`) : new Date();
    const demoPhases: HormonePhase[] = [
      "Follicular",
      "Follicular",
      "Ovulatory",
      "Luteal",
      "Luteal",
      "Irregular / Suppressed",
      "Irregular / Suppressed",
    ];
    const demo: DailyEntry[] = Array.from({ length: 7 }).map((_, idx) => {
      const d = format(subDays(baseDate, 6 - idx), "yyyy-MM-dd");
      const lowSleep = idx === 1 || idx === 4;
      return {
        id: `demo-${idx}`,
        date: d,
        brainFog: lowSleep ? 8 : idx === 3 ? 6 : 3,
        focus: lowSleep ? 4 : idx === 3 ? 6 : 8,
        energy: lowSleep ? 4 : 7,
        mood: lowSleep ? 5 : 8,
        sleepHours: lowSleep ? 5.5 : 7.5 + (idx % 2) * 0.5,
        cycleDay: idx >= 5 ? "N/A" : String(10 + idx * 3),
        hormonePhase: demoPhases[idx],
        symptoms: lowSleep
          ? ["Afternoon Crash", "Sugar Cravings", "Word-Finding Slip"]
          : ["Steady Energy"],
        triggers: lowSleep
          ? ["Poor Sleep (<6.5h)", "Late Meal / High Carb", "High Caffeine"]
          : ["Post-Meal Walk", "Med / Supplement"],
        notes: lowSleep
          ? "Short sleep + late dinner; slower recall the next morning."
          : "Protein breakfast and 10-min walk kept afternoon focus steady.",
        reactionMs: lowSleep ? 445 : 335 + idx * 5,
        stroopScore: lowSleep ? 6 : 10,
      };
    });
    const demoRuns: CognitiveRun[] = demo.map((d) => ({
      date: d.date,
      reactionMs: d.reactionMs,
      stroopScore: d.stroopScore,
    }));
    persistEntries(demo);
    persistStats(Math.max(xp, 240), 335, 10, demoRuns);
  };

  const clearAllData = () => {
    const ok = window.confirm(
      `Permanently delete all ${entries.length} logged entries and cognitive baselines from this browser?`
    );
    if (!ok) return;
    persistEntries([]);
    persistStats(0, null, null, []);
  };

  // Encrypted Export / Import Handlers with Schema Validation & Merge Option
  const handleEncryptedExport = async () => {
    if (!backupPass.trim()) {
      setBackupStatus("Enter a passphrase first.");
      return;
    }
    try {
      const cipherJson = await encryptPayload(
        { entries, stats: { xp, bestReactionMs, bestStroopScore, runs } },
        backupPass
      );
      const blob = new Blob([cipherJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clarity-encrypted-${todayIso || "backup"}.clarity.enc`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus("Encrypted backup downloaded.");
    } catch {
      setBackupStatus("Encryption failed in this browser.");
    }
  };

  const handleEncryptedImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!backupPass.trim()) {
      setBackupStatus("Enter your backup passphrase before selecting a file.");
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      const restored = await decryptPayload(text, backupPass);
      if (!Array.isArray(restored.entries)) {
        throw new Error("Backup contains no valid entry array.");
      }
      const validImported = restored.entries.filter(isValidEntry);
      if (validImported.length === 0 && restored.entries.length > 0) {
        throw new Error("Entries failed schema validation.");
      }

      if (entries.length > 0) {
        const replaceAll = window.confirm(
          `Found ${validImported.length} valid entries in backup.\n\nClick OK to REPLACE your current ${entries.length} entries, or Cancel to MERGE by date.`
        );
        if (replaceAll) {
          persistEntries(validImported);
        } else {
          const map = new Map<string, DailyEntry>();
          entries.forEach((item) => map.set(item.date, item));
          validImported.forEach((item: DailyEntry) => map.set(item.date, item));
          persistEntries(Array.from(map.values()));
        }
      } else {
        persistEntries(validImported);
      }

      if (restored.stats && typeof restored.stats === "object") {
        const importedRuns = Array.isArray(restored.stats.runs)
          ? restored.stats.runs
          : [];
        persistStats(
          Math.max(xp, Number(restored.stats.xp) || 0),
          restored.stats.bestReactionMs ?? bestReactionMs,
          restored.stats.bestStroopScore ?? bestStroopScore,
          [...runs, ...importedRuns].slice(-60)
        );
      }
      setBackupStatus(`Successfully imported ${validImported.length} verified entries.`);
    } catch (err) {
      setBackupStatus(
        err instanceof Error
          ? err.message
          : "Wrong passphrase or invalid backup file."
      );
    } finally {
      e.target.value = "";
    }
  };

  // True Consecutive-Day Streak (anchored to today or yesterday)
  const streak = useMemo(() => {
    if (entries.length === 0 || !todayIso) return 0;
    const uniqueDates = Array.from(new Set(entries.map((e) => e.date))).sort(
      (a, b) => b.localeCompare(a)
    );
    const todayDate = parseISO(todayIso);
    const latestDate = parseISO(uniqueDates[0]);
    const gapFromToday = differenceInCalendarDays(todayDate, latestDate);
    if (gapFromToday > 1) return 0;

    let count = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = parseISO(uniqueDates[i]);
      const prev = parseISO(uniqueDates[i + 1]);
      if (differenceInCalendarDays(curr, prev) === 1) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [entries, todayIso]);

  // 14-Day Rolling Cognitive Baseline
  const baselines = useMemo(() => {
    const recentRuns = runs.slice(-14);
    const rxValues = recentRuns
      .map((r) => r.reactionMs)
      .filter((v): v is number => typeof v === "number");
    const stValues = recentRuns
      .map((r) => r.stroopScore)
      .filter((v): v is number => typeof v === "number");

    const baselineMs = rxValues.length
      ? Math.round(rxValues.reduce((a, b) => a + b, 0) / rxValues.length)
      : null;
    const baselineStroop = stValues.length
      ? Number(
          (stValues.reduce((a, b) => a + b, 0) / stValues.length).toFixed(1)
        )
      : null;
    return { baselineMs, baselineStroop };
  }, [runs]);

  // Metabolic, Sleep & Phase Correlation Engine (with sample-size guards & true next-day pairing)
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

    const nudges: string[] = [];
    const MIN_BUCKET = 3;

    // Pair consecutive days (entries[i] -> entries[i + 1]) for true next-day effects
    const nextDayPairs: { prev: DailyEntry; next: DailyEntry }[] = [];
    for (let i = 0; i < entries.length - 1; i++) {
      const d1 = parseISO(entries[i].date);
      const d2 = parseISO(entries[i + 1].date);
      if (differenceInCalendarDays(d2, d1) === 1) {
        nextDayPairs.push({ prev: entries[i], next: entries[i + 1] });
      }
    }

    // 1. Sleep duration -> Next-day Focus (requires >= 3 days per bucket)
    const afterShortSleep = nextDayPairs.filter((p) => p.prev.sleepHours < 6.5);
    const afterGoodSleep = nextDayPairs.filter((p) => p.prev.sleepHours >= 6.5);
    if (
      afterShortSleep.length >= MIN_BUCKET &&
      afterGoodSleep.length >= MIN_BUCKET
    ) {
      const shortFocus =
        afterShortSleep.reduce((s, p) => s + p.next.focus, 0) /
        afterShortSleep.length;
      const goodFocus =
        afterGoodSleep.reduce((s, p) => s + p.next.focus, 0) /
        afterGoodSleep.length;
      if (goodFocus > 0) {
        const dropPct = Math.round(((goodFocus - shortFocus) / goodFocus) * 100);
        if (dropPct > 0) {
          nudges.push(
            `Next-day focus averages ~${dropPct}% lower after <6.5h sleep (${shortFocus.toFixed(
              1
            )}/10 vs. ${goodFocus.toFixed(1)}/10; n=${afterShortSleep.length} vs ${
              afterGoodSleep.length
            } pairs).`
          );
        }
      }
    }

    // 2. Late Meal / High Carb -> Next-day Brain Fog (requires >= 3 days per bucket)
    const afterLateCarb = nextDayPairs.filter((p) =>
      p.prev.triggers?.includes("Late Meal / High Carb")
    );
    const afterNormalMeal = nextDayPairs.filter(
      (p) => !p.prev.triggers?.includes("Late Meal / High Carb")
    );
    if (
      afterLateCarb.length >= MIN_BUCKET &&
      afterNormalMeal.length >= MIN_BUCKET
    ) {
      const lateFog = (
        afterLateCarb.reduce((s, p) => s + p.next.brainFog, 0) /
        afterLateCarb.length
      ).toFixed(1);
      const normalFog = (
        afterNormalMeal.reduce((s, p) => s + p.next.brainFog, 0) /
        afterNormalMeal.length
      ).toFixed(1);
      nudges.push(
        `Next-day brain fog averages ${lateFog}/10 after "Late Meal / High Carb" vs. ${normalFog}/10 otherwise (n=${afterLateCarb.length} vs ${afterNormalMeal.length} pairs).`
      );
    }

    // 3. Hormone Phase Pattern (requires >= 3 days in top phase and >= 5 total entries)
    if (entries.length >= 5) {
      const phaseMap: Record<string, { totalFog: number; count: number }> = {};
      entries.forEach((e) => {
        const p = e.hormonePhase || "Follicular";
        if (!phaseMap[p]) phaseMap[p] = { totalFog: 0, count: 0 };
        phaseMap[p].totalFog += e.brainFog;
        phaseMap[p].count += 1;
      });
      const rankedPhases = Object.entries(phaseMap)
        .filter(([, d]) => d.count >= MIN_BUCKET)
        .map(([phase, d]) => ({
          phase,
          avg: d.totalFog / d.count,
          count: d.count,
        }))
        .sort((a, b) => b.avg - a.avg);

      if (rankedPhases.length > 0 && Object.keys(phaseMap).length > 1) {
        const top = rankedPhases[0];
        nudges.push(
          `Early observation: highest average brain fog (${top.avg.toFixed(
            1
          )}/10 across n=${top.count} logged days) appears during ${top.phase}.`
        );
      }
    }

    // 4. Same-day Post-Meal Walk association (requires >= 3 days)
    const walkDays = entries.filter((e) =>
      e.triggers?.includes("Post-Meal Walk")
    );
    if (walkDays.length >= MIN_BUCKET) {
      const walkFocus = (
        walkDays.reduce((s, e) => s + e.focus, 0) / walkDays.length
      ).toFixed(1);
      nudges.push(
        `Days tagged "Post-Meal Walk" average ${walkFocus}/10 focus (n=${walkDays.length} days).`
      );
    }

    // Top Triggers & Symptoms for Doctor Brief
    const triggerCounts: Record<string, number> = {};
    entries.forEach((e) =>
      (e.triggers || []).forEach((t) => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      })
    );
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { avgFog, avgFocus, avgSleep, nudges, topTriggers };
  }, [entries]);

  const chartData = useMemo(() => {
    return entries.map((e) => {
      const phaseObj =
        HORMONE_PHASES.find((p) => p.label === e.hormonePhase) ||
        HORMONE_PHASES[0];
      return {
        ...e,
        phaseBand: 10,
        phaseColor: phaseObj.color,
        reactionScaled: e.reactionMs
          ? Number((e.reactionMs / 100).toFixed(2))
          : null,
      };
    });
  }, [entries]);

  const slidersComplete =
    brainFog !== null && focus !== null && energy !== null && mood !== null;

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
              onClick={() => setBackupOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D5CEC2] hover:border-[#1C1F1D] text-xs font-semibold transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#2F5D50]" /> Encrypted Backup
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

        {/* Encrypted Local Backup & Restore Drawer */}
        {backupOpen && (
          <div className="bg-white/95 border border-[#D5CEC2] rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2F5D50]" /> AES-256 Encrypted Local Backup &amp; Restore
              </h2>
              <p className="text-xs text-[#5A605C]">
                Your history never touches a server. Encrypt it with a passphrase to export or merge onto another browser.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="password"
                value={backupPass}
                onChange={(e) => setBackupPass(e.target.value)}
                placeholder="Enter backup passphrase..."
                className="flex-1 rounded-xl bg-[#F7F5F0] border border-[#D8D0C3] px-3.5 py-2 text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleEncryptedExport}
                disabled={entries.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] disabled:opacity-40 text-[#F7F5F0] text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export .clarity.enc
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#1C1F1D] text-xs font-semibold hover:bg-[#EFECE6] transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Import Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".enc,.json"
                onChange={handleEncryptedImport}
                className="hidden"
              />
            </div>

            {backupStatus && (
              <p className="text-xs font-semibold text-[#2F5D50]">
                {backupStatus}
              </p>
            )}
          </div>
        )}

        {/* XP & Consecutive-Day Streak Bar */}
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

            {/* Hormone Phase Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                Cycle / Hormone State
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HORMONE_PHASES.map((p) => {
                  const active = hormonePhase === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setHormonePhase(p.label)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                        active
                          ? "bg-[#1C1F1D] text-[#F7F5F0] border-[#1C1F1D]"
                          : "bg-[#F7F5F0] text-[#4F5551] border-[#D8D0C3] hover:border-[#1C1F1D]"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-[11px] font-semibold leading-tight">
                        {p.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders (Start unrated so users actively select values) */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Brain Fog (1–10)</span>
                  <span className="text-[#2F5D50]">
                    {brainFog !== null ? `${brainFog}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={brainFog ?? 5}
                  onChange={(e) => setBrainFog(Number(e.target.value))}
                  onPointerDown={() => {
                    if (brainFog === null) setBrainFog(5);
                  }}
                  className="w-full accent-[#2F5D50]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Mental Focus (1–10)</span>
                  <span className="text-[#2F5D50]">
                    {focus !== null ? `${focus}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={focus ?? 5}
                  onChange={(e) => setFocus(Number(e.target.value))}
                  onPointerDown={() => {
                    if (focus === null) setFocus(5);
                  }}
                  className="w-full accent-[#2F5D50]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Physical Energy (1–10)</span>
                  <span className="text-[#2F5D50]">
                    {energy !== null ? `${energy}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy ?? 5}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  onPointerDown={() => {
                    if (energy === null) setEnergy(5);
                  }}
                  className="w-full accent-[#2F5D50]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Mood Stability (1–10)</span>
                  <span className="text-[#2F5D50]">
                    {mood !== null ? `${mood}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={mood ?? 5}
                  onChange={(e) => setMood(Number(e.target.value))}
                  onPointerDown={() => {
                    if (mood === null) setMood(5);
                  }}
                  className="w-full accent-[#2F5D50]"
                />
              </div>
            </div>

            {/* Sleep & Cycle Day (Empty placeholders instead of fabricated defaults) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Sleep Hours
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={20}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full rounded-xl bg-[#F7F5F0] border border-[#D8D0C3] px-3.5 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Cycle Day (optional)
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

            {/* 1-Tap Trigger & Habit Quick-Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                1-Tap Triggers &amp; Habits
              </label>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_OPTIONS.map((trig) => {
                  const active = triggers.includes(trig);
                  return (
                    <button
                      key={trig}
                      type="button"
                      onClick={() => toggleItem(trig, setTriggers)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                        active
                          ? "bg-[#1C1F1D] text-[#F7F5F0] border-[#1C1F1D]"
                          : "bg-white text-[#4F5551] border-[#D8D0C3] hover:border-[#1C1F1D]"
                      }`}
                    >
                      {trig}
                    </button>
                  );
                })}
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
                      onClick={() => toggleItem(sym, setSymptoms)}
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

            {formError && (
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A84A32]">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </p>
            )}

            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition cursor-pointer ${
                  slidersComplete && sleepHours !== ""
                    ? "bg-[#1C1F1D] hover:bg-[#2F5D50] text-[#F7F5F0]"
                    : "bg-[#D5CEC2] text-[#5A605C]"
                }`}
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

          {/* Right 5 Cols: Brain Gym with 14-Day Baseline Calibration */}
          <div className="lg:col-span-5 space-y-6">
            <CognitiveMiniTest
              bestMs={bestReactionMs}
              baselineMs={baselines.baselineMs}
              onComplete={(ms) => recordCognitiveScore("reaction", ms)}
            />

            <StroopGame
              bestScore={bestStroopScore}
              baselineScore={baselines.baselineStroop}
              onComplete={(sc) => recordCognitiveScore("stroop", sc)}
            />
          </div>
        </div>

        {/* Analytics, Metabolic Nudges & Cycle Overlay Chart */}
        {analytics && (
          <section className="bg-white/85 border border-[#E3DDD2] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50]">
                  On-Device Pattern &amp; Phase Engine
                </p>
                <h2 className="font-serif text-2xl font-normal">
                  Hormone Overlay &amp; Metabolic Correlations ({entries.length} entries)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPhaseOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    showPhaseOverlay
                      ? "bg-[#2F5D50] text-[#F7F5F0] border-[#2F5D50]"
                      : "bg-[#F7F5F0] text-[#5A605C] border-[#D8D0C3]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Phase Overlay
                </button>
                <button
                  type="button"
                  onClick={() => setShowReactionOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    showReactionOverlay
                      ? "bg-[#1C1F1D] text-[#F7F5F0] border-[#1C1F1D]"
                      : "bg-[#F7F5F0] text-[#5A605C] border-[#D8D0C3]"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" /> Reaction Trend
                </button>
              </div>
            </div>

            {/* Sample-Size Aware Nudges */}
            {analytics.nudges.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {analytics.nudges.map((nudge, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E3DDD2] flex items-start gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#2F5D50] shrink-0 mt-0.5" />
                    <p className="font-serif text-sm text-[#1C1F1D] leading-snug">
                      {nudge}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#5A605C] bg-[#F7F5F0] border border-[#E3DDD2] rounded-xl px-4 py-3">
                Log at least 5–6 consecutive days (with at least 3 days per sleep/meal comparison bucket) to unlock statistical pattern nudges.
              </p>
            )}

            {/* Phase Legend */}
            {showPhaseOverlay && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-[#5A605C]">
                <span>Hormone Phase Bands:</span>
                {HORMONE_PHASES.map((p) => (
                  <span key={p.label} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs inline-block"
                      style={{ backgroundColor: p.color, opacity: 0.45 }}
                    />
                    {p.label}
                  </span>
                ))}
              </div>
            )}

            {/* Composed Chart */}
            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
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
                    formatter={(
                      value: unknown,
                      name: unknown,
                      props: { payload?: DailyEntry }
                    ) => {
                      if (name === "Hormone Phase") {
                        return [props?.payload?.hormonePhase || "—", "Phase"];
                      }
                      if (name === "Reaction (x100ms)") {
                        return [
                          `${Math.round(Number(value) * 100)}ms`,
                          "Reaction Speed",
                        ];
                      }
                      return [`${value}/10`, String(name)];
                    }}
                  />
                  {showPhaseOverlay && (
                    <Bar
                      dataKey="phaseBand"
                      name="Hormone Phase"
                      barSize={26}
                      isAnimationActive={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.phaseColor}
                          fillOpacity={0.18}
                        />
                      ))}
                    </Bar>
                  )}
                  <Line
                    type="monotone"
                    dataKey="focus"
                    name="Focus"
                    stroke="#2F5D50"
                    strokeWidth={2.5}
                    dot={{ r: 3.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="brainFog"
                    name="Brain Fog"
                    stroke="#A84A32"
                    strokeWidth={2.25}
                    dot={{ r: 3.5 }}
                  />
                  {showReactionOverlay && (
                    <Line
                      type="monotone"
                      dataKey="reactionScaled"
                      name="Reaction (x100ms)"
                      stroke="#3B5266"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </main>

      {/* PRINT-ONLY 1-PAGE CLINICAL DOCTOR BRIEF */}
      <section className="hidden print:block p-8 bg-white text-black space-y-5">
        <div className="border-b-2 border-black pb-3 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              Clarity — PMOS Symptom, Trigger &amp; Cognitive Brief
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
          <div className="grid grid-cols-4 gap-3 border border-gray-300 p-3.5 rounded">
            <div>
              <p className="text-[10px] uppercase text-gray-500">Avg Brain Fog</p>
              <p className="text-base font-bold">{analytics.avgFog} / 10</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500">Avg Focus</p>
              <p className="text-base font-bold">{analytics.avgFocus} / 10</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500">Avg Sleep</p>
              <p className="text-base font-bold">{analytics.avgSleep} hrs</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500">14d Reaction Base</p>
              <p className="text-base font-bold">
                {baselines.baselineMs ? `${baselines.baselineMs}ms` : "—"}
              </p>
            </div>
          </div>
        )}

        {analytics && analytics.topTriggers.length > 0 && (
          <div className="text-xs border border-gray-300 p-3 rounded">
            <span className="font-bold uppercase tracking-wider mr-2">
              Recurring Triggers Logged:
            </span>
            {analytics.topTriggers
              .map(([name, count]) => `${name} (${count}d)`)
              .join(" · ")}
          </div>
        )}

        <div>
          <h2 className="font-bold text-xs uppercase tracking-wider mb-2">
            Recent Entries &amp; Hormone Context
          </h2>
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-left">Date</th>
                <th className="border border-gray-300 p-1.5 text-left">Phase</th>
                <th className="border border-gray-300 p-1.5">Fog</th>
                <th className="border border-gray-300 p-1.5">Focus</th>
                <th className="border border-gray-300 p-1.5">Sleep</th>
                <th className="border border-gray-300 p-1.5 text-left">Triggers &amp; Signals</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(-7).map((e) => (
                <tr key={e.id}>
                  <td className="border border-gray-300 p-1.5">{e.date}</td>
                  <td className="border border-gray-300 p-1.5">{e.hormonePhase}</td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    {e.brainFog}/10
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    {e.focus}/10
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    {e.sleepHours}h
                  </td>
                  <td className="border border-gray-300 p-1.5">
                    {[...(e.triggers || []), ...e.symptoms].join(", ") || "—"}
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
          <p className="text-[11px] text-gray-500 pt-1">
            Disclaimer: Educational self-tracking summary only; not a medical
            diagnosis.
          </p>
        </div>
      </section>
    </div>
  );
}