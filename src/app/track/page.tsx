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
  X,
  HeartPulse,
  Calendar,
} from "lucide-react";
import GamificationBar from "@/components/GamificationBar";
import CognitiveMiniTest from "@/components/CognitiveMiniTest";
import StroopGame from "@/components/StroopGame";
import ThemeToggle from "@/components/ThemeToggle";
import CareCompanion from "@/components/CareCompanion";

type HormonePhase =
  | "Period / Bleeding (Days 1–5)"
  | "Post-Period / Mid-Cycle"
  | "Pre-Period / PMS Window"
  | "Perimenopause / Irregular / Not Sure";

interface DailyEntry {
  id: string;
  date: string;
  brainFog: number;
  focus: number;
  energy: number;
  mood: number;
  sleepHours: number;
  cycleDay: string;
  hormonePhase: HormonePhase | null;
  symptoms: string[];
  symptomScores: Record<string, number>;
  triggers: string[];
  bpSystolic?: number;
  bpDiastolic?: number;
  restingHr?: number;
  notes: string;
  reactionMs?: number;
  stroopScore?: number;
}

interface LipidSnapshot {
  date: string;
  ldl: string;
  hdl: string;
  triglycerides: string;
  hba1c: string;
}

interface CognitiveRun {
  date: string;
  reactionMs?: number;
  stroopScore?: number;
}

const HORMONE_PHASES: {
  label: HormonePhase;
  color: string;
  short: string;
  hint: string;
}[] = [
  {
    label: "Period / Bleeding (Days 1–5)",
    color: "#A84A32",
    short: "Period / Bleeding",
    hint: "Active bleeding days",
  },
  {
    label: "Post-Period / Mid-Cycle",
    color: "#4D8B7A",
    short: "Post-Period / Mid",
    hint: "After bleeding ends (~Days 6–15)",
  },
  {
    label: "Pre-Period / PMS Window",
    color: "#D99B26",
    short: "Pre-Period / PMS",
    hint: "Week or two before next period",
  },
  {
    label: "Perimenopause / Irregular / Not Sure",
    color: "#7C858E",
    short: "Irregular / Not Sure",
    hint: "Skipped cycles, birth control, or unsure",
  },
];

const SYMPTOM_CATEGORIES: { category: string; items: string[] }[] = [
  {
    category: "GI & Glycemic",
    items: [
      "Bloating",
      "Afternoon Crash",
      "Sugar Cravings",
      "GI / Nausea",
    ],
  },
  {
    category: "Perimenopause & Hormonal",
    items: [
      "Hot Flashes",
      "Night Sweats",
      "Cycle Spotting / Irregularity",
      "Breast Tenderness",
      "Acne / Skin Flare",
      "Hair Shedding",
    ],
  },
  {
    category: "Cardiometabolic & Vascular",
    items: [
      "Palpitations / Racing Heart",
      "Exertional Fatigue / Breathlessness",
      "Dizziness / Lightheadedness",
      "Swelling / Fluid Retention",
    ],
  },
  {
    category: "Cognitive & Pain",
    items: [
      "Word-Finding Slip",
      "Restless Sleep",
      "Headache",
      "Pelvic / Cramp Pain",
      "Body / Joint Ache",
    ],
  },
];

const TRIGGER_OPTIONS = [
  "High Stress",
  "Poor Sleep (<6.5h)",
  "Late Meal / High Carb",
  "High Caffeine",
  "Med / Statin / Supplement",
  "Post-Meal Walk",
];

const STORAGE_KEY = "clarity_pmos_entries_v8";
const STATS_KEY = "clarity_pmos_stats_v8";
const LIPIDS_KEY = "clarity_pmos_lipids_v1";
const CUSTOM_SYMPTOMS_KEY = "clarity_pmos_custom_symptoms_v1";

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
      iterations: 150000,
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
    v: 3,
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
    typeof e.sleepHours === "number" &&
    Array.isArray(e.symptoms) &&
    Array.isArray(e.triggers)
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

  // Progressive disclosure toggles (keeps daily check-in calm)
  const [showVitalsAndLabs, setShowVitalsAndLabs] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Custom Symptom Catalog & Active Category Tab
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [newSymptomText, setNewSymptomText] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Cardiometabolic Lipid Snapshot
  const [lipids, setLipids] = useState<LipidSnapshot>({
    date: "",
    ldl: "",
    hdl: "",
    triglycerides: "",
    hba1c: "",
  });
  const [lipidsSavedMsg, setLipidsSavedMsg] = useState(false);

  // Chart Overlays & Individual Symptom Analysis Selector
  const [showPhaseOverlay, setShowPhaseOverlay] = useState(true);
  const [showReactionOverlay, setShowReactionOverlay] = useState(true);
  const [selectedSymptomFilter, setSelectedSymptomFilter] = useState<string>("ALL");

  // Encrypted Backup State
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupPass, setBackupPass] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Client-hydrated dates
  const [todayIso, setTodayIso] = useState("");
  const [date, setDate] = useState("");
  const [printDate, setPrintDate] = useState("");

  // Form State
  const [brainFog, setBrainFog] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<string>("");
  const [cycleDay, setCycleDay] = useState<string>("");
  const [hormonePhase, setHormonePhase] = useState<HormonePhase | null>(null);
  const [symptomScores, setSymptomScores] = useState<Record<string, number>>({});
  const [triggers, setTriggers] = useState<string[]>([]);
  const [bpSystolic, setBpSystolic] = useState<string>("");
  const [bpDiastolic, setBpDiastolic] = useState<string>("");
  const [restingHr, setRestingHr] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const now = new Date();
    const iso = format(now, "yyyy-MM-dd");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayIso(iso);
    setDate((prev) => prev || iso);
    setPrintDate(format(now, "MMM d, yyyy"));

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isValidEntry).map((e) => ({
            ...e,
            symptomScores:
              e.symptomScores && typeof e.symptomScores === "object"
                ? e.symptomScores
                : Object.fromEntries(e.symptoms.map((s) => [s, 3])),
          }));
          setEntries(valid);
        }
      }
      const rawStats = localStorage.getItem(STATS_KEY);
      if (rawStats) {
        const parsed = JSON.parse(rawStats);
        setXp(parsed.xp || 0);
        setBestReactionMs(parsed.bestReactionMs ?? null);
        setBestStroopScore(parsed.bestStroopScore ?? null);
        setRuns(Array.isArray(parsed.runs) ? parsed.runs : []);
      }
      const rawLipids = localStorage.getItem(LIPIDS_KEY);
      if (rawLipids) {
        const parsedLipids = JSON.parse(rawLipids);
        if (parsedLipids && typeof parsedLipids === "object") {
          setLipids((prev) => ({ ...prev, ...parsedLipids }));
        }
      }
      const rawCustom = localStorage.getItem(CUSTOM_SYMPTOMS_KEY);
      if (rawCustom) {
        const parsedCustom = JSON.parse(rawCustom);
        if (Array.isArray(parsedCustom)) setCustomSymptoms(parsedCustom);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const visibleSymptoms = useMemo(() => {
    const base =
      activeCategory === "ALL"
        ? SYMPTOM_CATEGORIES.flatMap((c) => c.items)
        : SYMPTOM_CATEGORIES.find((c) => c.category === activeCategory)?.items ||
          [];
    if (activeCategory === "ALL") {
      return Array.from(new Set([...base, ...customSymptoms]));
    }
    return base;
  }, [activeCategory, customSymptoms]);

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

  const handleLoadEntryIntoForm = (entry: DailyEntry) => {
    setDate(entry.date);
    setBrainFog(entry.brainFog);
    setFocus(entry.focus);
    setEnergy(entry.energy);
    setMood(entry.mood);
    setSleepHours(String(entry.sleepHours));
    setCycleDay(entry.cycleDay && entry.cycleDay !== "N/A" ? entry.cycleDay : "");
    setHormonePhase(entry.hormonePhase);
    setSymptomScores({ ...(entry.symptomScores || {}) });
    setTriggers([...(entry.triggers || [])]);
    setBpSystolic(entry.bpSystolic ? String(entry.bpSystolic) : "");
    setBpDiastolic(entry.bpDiastolic ? String(entry.bpDiastolic) : "");
    setRestingHr(entry.restingHr ? String(entry.restingHr) : "");
    setNotes(entry.notes || "");
    if (entry.bpSystolic || entry.bpDiastolic || entry.restingHr) {
      setShowVitalsAndLabs(true);
    }
    setFormError("");
  };

  const handleDeleteSingleEntry = (entryDate: string) => {
    const ok = window.confirm(`Delete logged entry for ${entryDate}?`);
    if (!ok) return;
    persistEntries(entries.filter((e) => e.date !== entryDate));
  };

  const handleSaveLipids = () => {
    const toSave = { ...lipids, date: lipids.date || todayIso };
    setLipids(toSave);
    localStorage.setItem(LIPIDS_KEY, JSON.stringify(toSave));
    setLipidsSavedMsg(true);
    setTimeout(() => setLipidsSavedMsg(false), 2500);
  };

  const toggleTrigger = (item: string) => {
    setTriggers((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleSymptom = (sym: string) => {
    setSymptomScores((prev) => {
      const copy = { ...prev };
      if (sym in copy) {
        delete copy[sym];
      } else {
        copy[sym] = 2;
      }
      return copy;
    });
  };

  const setSymptomSeverity = (sym: string, score: number) => {
    setSymptomScores((prev) => ({ ...prev, [sym]: score }));
  };

  const handleAddCustomSymptom = () => {
    const clean = newSymptomText.trim();
    if (!clean) return;
    const allKnown = [
      ...SYMPTOM_CATEGORIES.flatMap((c) => c.items),
      ...customSymptoms,
    ];
    if (!allKnown.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      const updated = [...customSymptoms, clean];
      setCustomSymptoms(updated);
      localStorage.setItem(CUSTOM_SYMPTOMS_KEY, JSON.stringify(updated));
    }
    setSymptomScores((prev) => ({ ...prev, [clean]: prev[clean] ?? 2 }));
    setNewSymptomText("");
  };

  const handleCycleDayChange = (val: string) => {
    setCycleDay(val);
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) return;
    if (num <= 5) {
      setHormonePhase("Period / Bleeding (Days 1–5)");
    } else if (num <= 15) {
      setHormonePhase("Post-Period / Mid-Cycle");
    } else {
      setHormonePhase("Pre-Period / PMS Window");
    }
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
      setFormError(
        "Please rate all four sliders (Fog, Focus, Energy, Mood) before saving."
      );
      return;
    }

    const parsedSleep = parseFloat(sleepHours);
    if (isNaN(parsedSleep) || parsedSleep < 0 || parsedSleep > 20) {
      setFormError("Please enter valid sleep hours (e.g. 7.5).");
      return;
    }

    const entryDate = date || todayIso || "2026-01-01";
    const existing = entries.find((item) => item.date === entryDate);

    const sameDayRuns = runs.filter((r) => r.date === entryDate);
    const latestReaction = [...sameDayRuns]
      .reverse()
      .find((r) => typeof r.reactionMs === "number")?.reactionMs;
    const latestStroop = [...sameDayRuns]
      .reverse()
      .find((r) => typeof r.stroopScore === "number")?.stroopScore;

    const sys = bpSystolic ? Number(bpSystolic) : undefined;
    const dia = bpDiastolic ? Number(bpDiastolic) : undefined;
    const hr = restingHr ? Number(restingHr) : undefined;

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
      symptoms: Object.keys(symptomScores),
      symptomScores: { ...symptomScores },
      triggers,
      bpSystolic: sys && !isNaN(sys) ? sys : undefined,
      bpDiastolic: dia && !isNaN(dia) ? dia : undefined,
      restingHr: hr && !isNaN(hr) ? hr : undefined,
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
      "Period / Bleeding (Days 1–5)",
      "Post-Period / Mid-Cycle",
      "Post-Period / Mid-Cycle",
      "Pre-Period / PMS Window",
      "Pre-Period / PMS Window",
      "Perimenopause / Irregular / Not Sure",
      "Perimenopause / Irregular / Not Sure",
    ];
    const demo: DailyEntry[] = Array.from({ length: 7 }).map((_, idx) => {
      const d = format(subDays(baseDate, 6 - idx), "yyyy-MM-dd");
      const prevShortSleep = idx === 1 || idx === 3 || idx === 5;
      const isShortSleepNight = idx === 0 || idx === 2 || idx === 4;
      const isPerimeno =
        demoPhases[idx] === "Perimenopause / Irregular / Not Sure";
      const isPrePeriod = demoPhases[idx] === "Pre-Period / PMS Window";

      const scores: Record<string, number> = {};
      if (isPerimeno) {
        scores["Hot Flashes"] = 3;
        scores["Night Sweats"] = 3;
        scores["Palpitations / Racing Heart"] = 2;
      }
      if (isPrePeriod) {
        scores["Bloating"] = 4;
        scores["Breast Tenderness"] = 2;
      }
      if (prevShortSleep) {
        scores["Afternoon Crash"] = 4;
        scores["Sugar Cravings"] = 3;
        scores["Word-Finding Slip"] = 3;
      }

      return {
        id: `demo-${idx}`,
        date: d,
        brainFog: prevShortSleep ? 8 : isPerimeno ? 6 : 3,
        focus: prevShortSleep ? 4 : isPerimeno ? 6 : 8,
        energy: prevShortSleep ? 4 : 7,
        mood: prevShortSleep ? 5 : 8,
        sleepHours: isShortSleepNight ? 5.5 : 7.8,
        cycleDay: isPerimeno ? "N/A" : String(2 + idx * 4),
        hormonePhase: demoPhases[idx],
        symptoms: Object.keys(scores),
        symptomScores: scores,
        triggers: isShortSleepNight
          ? ["Poor Sleep (<6.5h)", "Late Meal / High Carb", "High Caffeine"]
          : ["Post-Meal Walk", "Med / Statin / Supplement"],
        bpSystolic: isPerimeno ? 128 : 118,
        bpDiastolic: isPerimeno ? 82 : 76,
        restingHr: isPerimeno ? 78 : 68,
        notes: prevShortSleep
          ? "Short sleep + late dinner; noticed afternoon crash and word-finding drag."
          : "Protein breakfast and post-meal walk kept afternoon energy steady.",
        reactionMs: prevShortSleep ? 445 : 335 + idx * 4,
        stroopScore: prevShortSleep ? 6 : 10,
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

  const handleEncryptedExport = async () => {
    if (backupPass.trim().length < 8) {
      setBackupStatus("Use a passphrase of at least 8 characters.");
      return;
    }
    try {
      const cipherJson = await encryptPayload(
        {
          entries,
          lipids,
          stats: { xp, bestReactionMs, bestStroopScore, runs },
        },
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
    if (backupPass.trim().length < 8) {
      setBackupStatus(
        "Enter your backup passphrase (min 8 chars) before selecting a file."
      );
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      const restored = await decryptPayload(text, backupPass);
      if (!Array.isArray(restored.entries)) {
        throw new Error("Backup contains no valid entry array.");
      }
      const validImported: DailyEntry[] = restored.entries
        .filter(isValidEntry)
        .map((item: DailyEntry) => ({
          ...item,
          symptomScores:
            item.symptomScores && typeof item.symptomScores === "object"
              ? item.symptomScores
              : Object.fromEntries(item.symptoms.map((s) => [s, 3])),
        }));

      if (validImported.length === 0 && restored.entries.length > 0) {
        throw new Error("Entries failed schema validation.");
      }

      if (entries.length > 0) {
        const choice = window
          .prompt(
            `Found ${validImported.length} verified entries in backup.\nType MERGE to combine by date, REPLACE to overwrite current ${entries.length} entries, or Cancel to abort:`,
            "MERGE"
          )
          ?.trim()
          .toUpperCase();

        if (!choice || (choice !== "MERGE" && choice !== "REPLACE")) {
          setBackupStatus("Import cancelled.");
          e.target.value = "";
          return;
        }

        if (choice === "REPLACE") {
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

      if (restored.lipids && typeof restored.lipids === "object") {
        setLipids(restored.lipids);
        localStorage.setItem(LIPIDS_KEY, JSON.stringify(restored.lipids));
      }

      if (restored.stats && typeof restored.stats === "object") {
        const importedRuns: CognitiveRun[] = Array.isArray(restored.stats.runs)
          ? restored.stats.runs
          : [];
        const dedupedRuns = Array.from(
          new Map(
            [...runs, ...importedRuns].map((r) => [
              `${r.date}-${r.reactionMs ?? ""}-${r.stroopScore ?? ""}`,
              r,
            ])
          ).values()
        ).slice(-60);

        const mergedBestRx =
          bestReactionMs !== null &&
          typeof restored.stats.bestReactionMs === "number"
            ? Math.min(bestReactionMs, restored.stats.bestReactionMs)
            : restored.stats.bestReactionMs ?? bestReactionMs;

        const mergedBestStroop =
          bestStroopScore !== null &&
          typeof restored.stats.bestStroopScore === "number"
            ? Math.max(bestStroopScore, restored.stats.bestStroopScore)
            : restored.stats.bestStroopScore ?? bestStroopScore;

        persistStats(
          Math.max(xp, Number(restored.stats.xp) || 0),
          mergedBestRx,
          mergedBestStroop,
          dedupedRuns
        );
      }
      setBackupStatus(
        `Successfully imported ${validImported.length} verified entries.`
      );
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

  const symptomBreakdown = useMemo(() => {
    const stats: Record<
      string,
      {
        name: string;
        daysLogged: number;
        totalSeverity: number;
        phaseTotals: Record<string, { sum: number; count: number }>;
        triggerCounts: Record<string, number>;
      }
    > = {};

    entries.forEach((e) => {
      const scores = e.symptomScores || {};
      Object.entries(scores).forEach(([sym, sev]) => {
        if (!stats[sym]) {
          stats[sym] = {
            name: sym,
            daysLogged: 0,
            totalSeverity: 0,
            phaseTotals: {},
            triggerCounts: {},
          };
        }
        stats[sym].daysLogged += 1;
        stats[sym].totalSeverity += sev;

        const phaseLabel = e.hormonePhase || "Not Specified";
        if (!stats[sym].phaseTotals[phaseLabel]) {
          stats[sym].phaseTotals[phaseLabel] = { sum: 0, count: 0 };
        }
        stats[sym].phaseTotals[phaseLabel].sum += sev;
        stats[sym].phaseTotals[phaseLabel].count += 1;

        (e.triggers || []).forEach((t) => {
          stats[sym].triggerCounts[t] = (stats[sym].triggerCounts[t] || 0) + 1;
        });
      });
    });

    return Object.values(stats)
      .map((item) => {
        const avgSeverity = Number(
          (item.totalSeverity / item.daysLogged).toFixed(1)
        );
        const topPhaseEntry = Object.entries(item.phaseTotals)
          .map(([p, v]) => ({ phase: p, avg: v.sum / v.count, count: v.count }))
          .sort((a, b) => b.avg - a.avg)[0];
        const topTriggerEntry = Object.entries(item.triggerCounts).sort(
          (a, b) => b[1] - a[1]
        )[0];

        return {
          name: item.name,
          daysLogged: item.daysLogged,
          avgSeverity,
          peakPhase: topPhaseEntry
            ? `${topPhaseEntry.phase} (${topPhaseEntry.avg.toFixed(1)}/5, n=${topPhaseEntry.count})`
            : "—",
          topTrigger: topTriggerEntry
            ? `${topTriggerEntry[0]} (${topTriggerEntry[1]}d)`
            : "—",
        };
      })
      .sort(
        (a, b) => b.daysLogged - a.daysLogged || b.avgSeverity - a.avgSeverity
      );
  }, [entries]);

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

    const bpEntries = entries.filter(
      (e) => typeof e.bpSystolic === "number" && typeof e.bpDiastolic === "number"
    );
    const avgBp =
      bpEntries.length > 0
        ? `${Math.round(
            bpEntries.reduce((s, e) => s + (e.bpSystolic || 0), 0) /
              bpEntries.length
          )}/${Math.round(
            bpEntries.reduce((s, e) => s + (e.bpDiastolic || 0), 0) /
              bpEntries.length
          )}`
        : null;

    const nudges: string[] = [];
    const MIN_BUCKET = 3;

    const nextDayPairs: { prev: DailyEntry; next: DailyEntry }[] = [];
    for (let i = 0; i < entries.length - 1; i++) {
      const d1 = parseISO(entries[i].date);
      const d2 = parseISO(entries[i + 1].date);
      if (differenceInCalendarDays(d2, d1) === 1) {
        nextDayPairs.push({ prev: entries[i], next: entries[i + 1] });
      }
    }

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

    const walkDays = entries.filter((e) =>
      e.triggers?.includes("Post-Meal Walk")
    );
    const nonWalkDays = entries.filter(
      (e) => !e.triggers?.includes("Post-Meal Walk")
    );
    if (walkDays.length >= MIN_BUCKET && nonWalkDays.length >= MIN_BUCKET) {
      const walkFocus = (
        walkDays.reduce((s, e) => s + e.focus, 0) / walkDays.length
      ).toFixed(1);
      const nonWalkFocus = (
        nonWalkDays.reduce((s, e) => s + e.focus, 0) / nonWalkDays.length
      ).toFixed(1);
      nudges.push(
        `Focus averages ${walkFocus}/10 on "Post-Meal Walk" days vs. ${nonWalkFocus}/10 on non-walk days (n=${walkDays.length} vs ${nonWalkDays.length} days).`
      );
    }

    return { avgFog, avgFocus, avgSleep, avgBp, nudges };
  }, [entries]);

  const selectedSymptomDetail = useMemo(() => {
    if (selectedSymptomFilter === "ALL") return null;
    return (
      symptomBreakdown.find((s) => s.name === selectedSymptomFilter) || null
    );
  }, [selectedSymptomFilter, symptomBreakdown]);

  const chartData = useMemo(() => {
    return entries.map((e) => {
      const phaseObj = HORMONE_PHASES.find((p) => p.label === e.hormonePhase);
      const symRaw =
        selectedSymptomFilter !== "ALL"
          ? e.symptomScores?.[selectedSymptomFilter] ?? 0
          : null;
      return {
        ...e,
        phaseBand: 10,
        phaseColor: phaseObj ? phaseObj.color : "transparent",
        reactionScaled: e.reactionMs
          ? Number((e.reactionMs / 100).toFixed(2))
          : null,
        symptomScaled: symRaw !== null ? symRaw * 2 : null,
        symptomRaw: symRaw,
      };
    });
  }, [entries, selectedSymptomFilter]);

  const slidersComplete =
    brainFog !== null && focus !== null && energy !== null && mood !== null;

  const hasLipidValues =
    lipids.ldl || lipids.hdl || lipids.triglycerides || lipids.hba1c;

  const latestEntry = entries[entries.length - 1];

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#111412] text-[#1C1F1D] dark:text-[#ECEAE4] transition-colors">
      {/* Top Bar */}
      <header className="print:hidden border-b border-[#E3DDD2] dark:border-[#252B27] bg-[#F7F5F0]/90 dark:bg-[#111412]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2F5D50] dark:bg-[#52A88E]" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Clarity
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-5 text-xs font-medium text-[#5A605C] dark:text-[#A4AAA6]">
            <Link href="/" className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] transition">
              Home
            </Link>
            <Link href="/guide" className="hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] transition">
              Guide
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1C1F1D] dark:bg-[#52A88E] hover:bg-[#2F5D50] dark:hover:bg-[#66B89F] text-[#F7F5F0] dark:text-[#0F1311] font-semibold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Doctor Brief
            </button>
          </nav>
        </div>
      </header>

      {/* SCREEN VIEW */}
      <main className="print:hidden max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Header + Utility Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E3DDD2] dark:border-[#252B27] pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2F5D50] dark:text-[#66B89F]">
              Daily Check-In &amp; Pattern Log
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal mt-1">
              Log today&apos;s signals
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadDemoData}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#181D1A] border border-[#D5CEC2] dark:border-[#2E3631] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4] text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2F5D50] dark:text-[#66B89F]" /> Load 7-Day Demo
            </button>
            <button
              type="button"
              onClick={() => setBackupOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#181D1A] border border-[#D5CEC2] dark:border-[#2E3631] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4] text-xs font-semibold transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#2F5D50] dark:text-[#66B89F]" /> Backup
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

        {/* Encrypted Backup Drawer */}
        {backupOpen && (
          <div className="bg-white/95 dark:bg-[#181D1A] border border-[#D5CEC2] dark:border-[#2E3631] rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2F5D50] dark:text-[#66B89F]" /> AES-256 Encrypted Local Backup
              </h2>
              <p className="text-xs text-[#5A605C] dark:text-[#A4AAA6]">
                Stored locally in your browser. Use at least 8 characters to export or import a backup.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="password"
                value={backupPass}
                onChange={(e) => setBackupPass(e.target.value)}
                placeholder="Passphrase (min 8 characters)..."
                className="flex-1 rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] px-3.5 py-2 text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleEncryptedExport}
                disabled={entries.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1F1D] dark:bg-[#52A88E] hover:bg-[#2F5D50] dark:hover:bg-[#66B89F] disabled:opacity-40 text-[#F7F5F0] dark:text-[#0F1311] text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export .enc
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#121614] border border-[#1C1F1D] dark:border-[#ECEAE4] text-xs font-semibold hover:bg-[#EFECE6] dark:hover:bg-[#1E2521] transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Import
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
              <p className="text-xs font-semibold text-[#2F5D50] dark:text-[#66B89F]">
                {backupStatus}
              </p>
            )}
          </div>
        )}

        {/* Streak & XP Bar */}
        <GamificationBar
          xp={xp}
          streak={streak}
          logsCount={entries.length}
          bestReactionMs={bestReactionMs}
          bestStroopScore={bestStroopScore}
        />

        {/* Interactive PMOS Care Companion */}
        <CareCompanion
          loggedToday={Boolean(todayIso && entries.some((e) => e.date === todayIso))}
          cognitiveDoneToday={Boolean(todayIso && runs.some((r) => r.date === todayIso))}
          streak={streak}
          lastSleepHours={latestEntry?.sleepHours}
          lastFog={latestEntry?.brainFog}
        />

        {/* Calm Check-In Form + Cognitive Checks */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveEntry}
            className="lg:col-span-7 bg-white/85 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] rounded-2xl p-6 sm:p-7 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#EFECE6] dark:border-[#252B27] pb-4">
              <h2 className="font-serif text-xl font-medium">
                Quick Check-In
              </h2>
              <input
                type="date"
                aria-label="Entry Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs font-semibold bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] rounded-lg px-3 py-1.5 text-[#1C1F1D] dark:text-[#ECEAE4]"
              />
            </div>

            {/* Core Sliders */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <label htmlFor="slider-fog">Brain Fog (1–10)</label>
                  <span className="text-[#2F5D50] dark:text-[#66B89F]">
                    {brainFog !== null ? `${brainFog}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  id="slider-fog"
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
                  <label htmlFor="slider-focus">Mental Focus (1–10)</label>
                  <span className="text-[#2F5D50] dark:text-[#66B89F]">
                    {focus !== null ? `${focus}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  id="slider-focus"
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
                  <label htmlFor="slider-energy">Physical Energy (1–10)</label>
                  <span className="text-[#2F5D50] dark:text-[#66B89F]">
                    {energy !== null ? `${energy}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  id="slider-energy"
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
                  <label htmlFor="slider-mood">Mood Stability (1–10)</label>
                  <span className="text-[#2F5D50] dark:text-[#66B89F]">
                    {mood !== null ? `${mood}/10` : "Tap to rate"}
                  </span>
                </div>
                <input
                  id="slider-mood"
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

            {/* Sleep & Cycle Day */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="input-sleep" className="block text-xs font-semibold mb-1.5">
                  Sleep Hours *
                </label>
                <input
                  id="input-sleep"
                  type="number"
                  step={0.5}
                  min={0}
                  max={20}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] px-3.5 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label htmlFor="input-cycle" className="block text-xs font-semibold mb-1.5">
                  Cycle Day (if known)
                </label>
                <input
                  id="input-cycle"
                  type="text"
                  value={cycleDay}
                  onChange={(e) => handleCycleDayChange(e.target.value)}
                  placeholder="Optional (e.g. 12)"
                  className="w-full rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] px-3.5 py-2 text-sm font-medium"
                />
              </div>
            </div>

            {/* Observable Cycle / Perimenopause Cue (Optional, No Guessing Required) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold">
                  Cycle or Perimenopause Cue{" "}
                  <span className="font-normal text-[#6E7570] dark:text-[#8E9691]">
                    (optional — pick what&apos;s obvious or &ldquo;Not Sure&rdquo;)
                  </span>
                </label>
                {hormonePhase && (
                  <button
                    type="button"
                    onClick={() => setHormonePhase(null)}
                    className="text-[11px] text-[#6E7570] dark:text-[#8E9691] hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HORMONE_PHASES.map((p) => {
                  const active = hormonePhase === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setHormonePhase(active ? null : p.label)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-0.5 ${
                        active
                          ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] border-[#1C1F1D] dark:border-[#ECEAE4]"
                          : "bg-[#F7F5F0] dark:bg-[#121614] text-[#4F5551] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-[11px] font-semibold leading-tight">
                          {p.short}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] leading-snug ${
                          active
                            ? "text-[#D5CEC2] dark:text-[#4F5551]"
                            : "text-[#6E7570] dark:text-[#8E9691]"
                        }`}
                      >
                        {p.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual Symptom Tracking with 1–5 Severity */}
            <div className="space-y-3 border-t border-[#EFECE6] dark:border-[#252B27] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold">
                  Symptoms (optional — tap to log &amp; rate 1–5)
                </label>
                <span className="text-[11px] text-[#6E7570] dark:text-[#8E9691]">
                  {Object.keys(symptomScores).length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCategory("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    activeCategory === "ALL"
                      ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412]"
                      : "bg-[#EFECE6] dark:bg-[#222824] text-[#5A605C] dark:text-[#A4AAA6] hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4]"
                  }`}
                >
                  All
                </button>
                {SYMPTOM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => setActiveCategory(cat.category)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      activeCategory === cat.category
                        ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412]"
                        : "bg-[#EFECE6] dark:bg-[#222824] text-[#5A605C] dark:text-[#A4AAA6] hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4]"
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {visibleSymptoms.map((sym) => {
                  const active = sym in symptomScores;
                  return (
                    <button
                      key={sym}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                        active
                          ? "bg-[#2F5D50] dark:bg-[#52A88E] text-[#F7F5F0] dark:text-[#0F1311] border-[#2F5D50] dark:border-[#52A88E]"
                          : "bg-[#F7F5F0] dark:bg-[#121614] text-[#4F5551] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4]"
                      }`}
                    >
                      {sym}
                      {active ? ` · ${symptomScores[sym]}/5` : ""}
                    </button>
                  );
                })}
              </div>

              {Object.keys(symptomScores).length > 0 && (
                <div className="space-y-2 pt-1">
                  {Object.entries(symptomScores).map(([sym, sev]) => (
                    <div
                      key={sym}
                      className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27]"
                    >
                      <span className="text-xs font-semibold">
                        {sym}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSymptomSeverity(sym, lvl)}
                            className={`w-6 h-6 rounded-full text-xs font-semibold transition cursor-pointer ${
                              sev === lvl
                                ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412]"
                                : "bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] text-[#5A605C] dark:text-[#A4AAA6] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4]"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                        <button
                          type="button"
                          aria-label={`Remove ${sym}`}
                          onClick={() => toggleSymptom(sym)}
                          className="ml-1 text-[#7A7F7B] hover:text-[#A84A32] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSymptomText}
                  onChange={(e) => setNewSymptomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSymptom();
                    }
                  }}
                  placeholder="Add custom symptom..."
                  className="flex-1 rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] px-3 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSymptom}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4] text-xs font-semibold transition cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Triggers */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                Triggers &amp; Habits (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_OPTIONS.map((trig) => {
                  const active = triggers.includes(trig);
                  return (
                    <button
                      key={trig}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTrigger(trig)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                        active
                          ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] border-[#1C1F1D] dark:border-[#ECEAE4]"
                          : "bg-white dark:bg-[#121614] text-[#4F5551] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4]"
                      }`}
                    >
                      {trig}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="input-notes" className="block text-xs font-semibold mb-1.5">
                Notes (optional)
              </label>
              <textarea
                id="input-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any context for yourself or your doctor..."
                className="w-full rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] px-3.5 py-2 text-sm"
              />
            </div>

            {/* Collapsible Vitals & Lipid Labs */}
            <div className="border-t border-[#EFECE6] dark:border-[#252B27] pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowVitalsAndLabs((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F5D50] dark:text-[#66B89F] hover:underline cursor-pointer"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                {showVitalsAndLabs
                  ? "Hide BP, Heart Rate & Lipid Labs"
                  : "+ Optional BP, Heart Rate & Lipid Labs (for Doctor Brief)"}
              </button>

              {showVitalsAndLabs && (
                <div className="p-4 rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="input-bp-sys" className="block text-[11px] font-semibold mb-1">
                        Systolic BP
                      </label>
                      <input
                        id="input-bp-sys"
                        type="number"
                        placeholder="120"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        className="w-full rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-bp-dia" className="block text-[11px] font-semibold mb-1">
                        Diastolic BP
                      </label>
                      <input
                        id="input-bp-dia"
                        type="number"
                        placeholder="80"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        className="w-full rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-hr" className="block text-[11px] font-semibold mb-1">
                        Resting HR
                      </label>
                      <input
                        id="input-hr"
                        type="number"
                        placeholder="72 bpm"
                        value={restingHr}
                        onChange={(e) => setRestingHr(e.target.value)}
                        className="w-full rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#E3DDD2] dark:border-[#252B27] pt-3 space-y-2.5">
                    <p className="text-[11px] font-semibold">
                      Recent Lipid &amp; Glycemic Snapshot
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="LDL (e.g. 135 mg/dL)"
                        value={lipids.ldl}
                        onChange={(e) =>
                          setLipids((p) => ({ ...p, ldl: e.target.value }))
                        }
                        className="rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="HDL (e.g. 48 mg/dL)"
                        value={lipids.hdl}
                        onChange={(e) =>
                          setLipids((p) => ({ ...p, hdl: e.target.value }))
                        }
                        className="rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Triglycerides (e.g. 165 mg/dL)"
                        value={lipids.triglycerides}
                        onChange={(e) =>
                          setLipids((p) => ({
                            ...p,
                            triglycerides: e.target.value,
                          }))
                        }
                        className="rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="HbA1c / Date (e.g. 5.8%)"
                        value={lipids.hba1c}
                        onChange={(e) =>
                          setLipids((p) => ({ ...p, hba1c: e.target.value }))
                        }
                        className="rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSaveLipids}
                        className="px-3.5 py-1 rounded-full bg-[#1C1F1D] dark:bg-[#52A88E] text-[#F7F5F0] dark:text-[#0F1311] text-[11px] font-semibold cursor-pointer"
                      >
                        Save Labs
                      </button>
                      {lipidsSavedMsg && (
                        <span className="text-[11px] font-semibold text-[#2F5D50] dark:text-[#66B89F]">
                          Saved for Doctor Brief
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                    ? "bg-[#1C1F1D] hover:bg-[#2F5D50] dark:bg-[#52A88E] dark:hover:bg-[#66B89F] text-[#F7F5F0] dark:text-[#0F1311]"
                    : "bg-[#D5CEC2] dark:bg-[#252B27] text-[#5A605C] dark:text-[#8E9691]"
                }`}
              >
                <Plus className="w-4 h-4" /> Save Entry (+30 XP)
              </button>

              {savedBanner && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F5D50] dark:text-[#66B89F]">
                  <CheckCircle2 className="w-4 h-4" /> Saved locally
                </span>
              )}
            </div>
          </form>

          {/* Right 5 Cols: Brain Gym */}
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

        {/* Analytics, Individual Symptom Lens & Chart */}
        {analytics && (
          <section className="bg-white/85 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFECE6] dark:border-[#252B27] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5D50] dark:text-[#66B89F]">
                  On-Device Pattern Engine
                </p>
                <h2 className="font-serif text-2xl font-normal">
                  Trends &amp; Correlations ({entries.length} entries)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {symptomBreakdown.length > 0 && (
                  <select
                    aria-label="Analyze Individual Symptom"
                    value={selectedSymptomFilter}
                    onChange={(e) => setSelectedSymptomFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] text-[#1C1F1D] dark:text-[#ECEAE4] cursor-pointer"
                  >
                    <option value="ALL">Symptom Lens: Overview</option>
                    {symptomBreakdown.map((s) => (
                      <option key={s.name} value={s.name}>
                        Isolate: {s.name} ({s.daysLogged}d)
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setShowPhaseOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    showPhaseOverlay
                      ? "bg-[#2F5D50] dark:bg-[#52A88E] text-[#F7F5F0] dark:text-[#0F1311] border-[#2F5D50] dark:border-[#52A88E]"
                      : "bg-[#F7F5F0] dark:bg-[#121614] text-[#5A605C] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Cue Overlay
                </button>
                <button
                  type="button"
                  onClick={() => setShowReactionOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    showReactionOverlay
                      ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] border-[#1C1F1D] dark:border-[#ECEAE4]"
                      : "bg-[#F7F5F0] dark:bg-[#121614] text-[#5A605C] dark:text-[#A4AAA6] border-[#D8D0C3] dark:border-[#2B322E]"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" /> Reaction Trend
                </button>
              </div>
            </div>

            {selectedSymptomDetail && (
              <div className="p-4 rounded-xl bg-[#2F5D50]/10 dark:bg-[#52A88E]/15 border border-[#2F5D50]/30 dark:border-[#52A88E]/30 grid sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2F5D50] dark:text-[#66B89F]">
                    Isolated Symptom
                  </p>
                  <p className="font-serif text-lg font-medium">
                    {selectedSymptomDetail.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5A605C] dark:text-[#A4AAA6]">
                    Frequency &amp; Avg Severity
                  </p>
                  <p className="font-serif text-base font-medium">
                    {selectedSymptomDetail.daysLogged}/{entries.length} days ·{" "}
                    {selectedSymptomDetail.avgSeverity}/5
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5A605C] dark:text-[#A4AAA6]">
                    Highest Severity Stage
                  </p>
                  <p className="font-serif text-sm font-medium">
                    {selectedSymptomDetail.peakPhase}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5A605C] dark:text-[#A4AAA6]">
                    Top Co-Occurring Trigger
                  </p>
                  <p className="font-serif text-sm font-medium">
                    {selectedSymptomDetail.topTrigger}
                  </p>
                </div>
              </div>
            )}

            {analytics.nudges.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {analytics.nudges.map((nudge, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] flex items-start gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#2F5D50] dark:text-[#66B89F] shrink-0 mt-0.5" />
                    <p className="font-serif text-sm leading-snug">
                      {nudge}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#5A605C] dark:text-[#A4AAA6] bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] rounded-xl px-4 py-3">
                Pattern comparisons appear once at least 3 days exist in both comparison buckets (for example, 3 nights &lt;6.5h sleep and 3 nights &ge;6.5h sleep).
              </p>
            )}

            {showPhaseOverlay && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-[#5A605C] dark:text-[#A4AAA6]">
                <span>Cycle / Perimenopause Bands:</span>
                {HORMONE_PHASES.map((p) => (
                  <span key={p.label} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs inline-block"
                      style={{ backgroundColor: p.color, opacity: 0.45 }}
                    />
                    {p.short}
                  </span>
                ))}
              </div>
            )}

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
                      props: {
                        payload?: DailyEntry & { symptomRaw?: number | null };
                      }
                    ) => {
                      if (name === "Cycle Cue") {
                        return [
                          props?.payload?.hormonePhase || "Not Specified",
                          "Stage",
                        ];
                      }
                      if (name === "Reaction (x100ms)") {
                        return [
                          `${Math.round(Number(value) * 100)}ms`,
                          "Reaction Speed",
                        ];
                      }
                      if (String(name).startsWith("Symptom:")) {
                        return [
                          `${props?.payload?.symptomRaw ?? 0}/5`,
                          String(name),
                        ];
                      }
                      return [`${value}/10`, String(name)];
                    }}
                  />
                  {showPhaseOverlay && (
                    <Bar
                      dataKey="phaseBand"
                      name="Cycle Cue"
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
                  {selectedSymptomFilter !== "ALL" && (
                    <Line
                      type="monotone"
                      dataKey="symptomScaled"
                      name={`Symptom: ${selectedSymptomFilter}`}
                      stroke="#B07D2B"
                      strokeWidth={2.75}
                      dot={{ r: 4 }}
                    />
                  )}
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

            {/* Individual Symptom Breakdown Cards */}
            {symptomBreakdown.length > 0 && (
              <div className="border-t border-[#EFECE6] dark:border-[#252B27] pt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5A605C] dark:text-[#A4AAA6]">
                  Individual Symptom Breakdown (tap to isolate on chart)
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {symptomBreakdown.map((item) => {
                    const isSelected = selectedSymptomFilter === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() =>
                          setSelectedSymptomFilter(isSelected ? "ALL" : item.name)
                        }
                        className={`text-left p-3.5 rounded-xl border transition cursor-pointer space-y-1 ${
                          isSelected
                            ? "bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] border-[#1C1F1D] dark:border-[#ECEAE4]"
                            : "bg-[#F7F5F0] dark:bg-[#121614] border-[#E3DDD2] dark:border-[#252B27] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-sm font-medium">
                            {item.name}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isSelected
                                ? "text-[#A7D7C5] dark:text-[#2F5D50]"
                                : "text-[#2F5D50] dark:text-[#66B89F]"
                            }`}
                          >
                            Avg {item.avgSeverity}/5
                          </span>
                        </div>
                        <p
                          className={`text-[11px] ${
                            isSelected
                              ? "text-[#D5CEC2] dark:text-[#4F5551]"
                              : "text-[#5A605C] dark:text-[#A4AAA6]"
                          }`}
                        >
                          {item.daysLogged}d · Peak: {item.peakPhase}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collapsible Logged Days List (Edit or Delete a Single Day) */}
            <div className="border-t border-[#EFECE6] dark:border-[#252B27] pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowAllLogs((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A605C] dark:text-[#A4AAA6] hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                {showAllLogs
                  ? "Hide Logged Entries"
                  : `Manage Logged Entries (${entries.length} days — edit or delete single day)`}
              </button>

              {showAllLogs && (
                <div className="divide-y divide-[#EFECE6] dark:divide-[#252B27] rounded-xl border border-[#E3DDD2] dark:border-[#252B27] bg-[#F7F5F0]/70 dark:bg-[#121614]/70">
                  {[...entries].reverse().map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{item.date}</span>
                        <span className="text-[#5A605C] dark:text-[#A4AAA6]">
                          Fog {item.brainFog}/10 · Focus {item.focus}/10 · Sleep{" "}
                          {item.sleepHours}h
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadEntryIntoForm(item)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181D1A] border border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#1C1F1D] dark:hover:border-[#ECEAE4] font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.date}`}
                          onClick={() => handleDeleteSingleEntry(item.date)}
                          className="p-1 text-[#7A7F7B] hover:text-[#A84A32] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* PRINT-ONLY 1-PAGE CLINICAL DOCTOR BRIEF */}
      <section className="hidden print:block p-8 bg-white text-black space-y-4">
        <div className="border-b-2 border-black pb-2.5 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              Clarity — PMOS Symptom, Cardiometabolic &amp; Cognitive Brief
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
          <div className="grid grid-cols-5 gap-2.5 border border-gray-300 p-3 rounded">
            <div>
              <p className="text-[10px] uppercase text-gray-500">Avg Brain Fog</p>
              <p className="text-sm font-bold">{analytics.avgFog} / 10</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500">Avg Focus</p>
              <p className="text-sm font-bold">{analytics.avgFocus} / 10</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500">Avg Sleep</p>
              <p className="text-sm font-bold">{analytics.avgSleep} hrs</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500">Avg BP</p>
              <p className="text-sm font-bold">{analytics.avgBp || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500">14d Reaction</p>
              <p className="text-sm font-bold">
                {baselines.baselineMs ? `${baselines.baselineMs}ms` : "—"}
              </p>
            </div>
          </div>
        )}

        {hasLipidValues && (
          <div className="text-xs border border-gray-300 p-2.5 rounded flex flex-wrap gap-4">
            <span className="font-bold uppercase tracking-wider">
              Patient-Reported Lipids / Glycemic:
            </span>
            {lipids.ldl && <span>LDL: {lipids.ldl}</span>}
            {lipids.hdl && <span>HDL: {lipids.hdl}</span>}
            {lipids.triglycerides && <span>TG: {lipids.triglycerides}</span>}
            {lipids.hba1c && <span>HbA1c: {lipids.hba1c}</span>}
          </div>
        )}

        {symptomBreakdown.length > 0 && (
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider mb-1.5">
              Individual Symptom Analysis
            </h2>
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1.5 text-left">Symptom</th>
                  <th className="border border-gray-300 p-1.5">Frequency</th>
                  <th className="border border-gray-300 p-1.5">Avg Severity</th>
                  <th className="border border-gray-300 p-1.5 text-left">Peak Stage</th>
                  <th className="border border-gray-300 p-1.5 text-left">Top Co-Occurring Trigger</th>
                </tr>
              </thead>
              <tbody>
                {symptomBreakdown.slice(0, 8).map((s) => (
                  <tr key={s.name}>
                    <td className="border border-gray-300 p-1.5 font-semibold">{s.name}</td>
                    <td className="border border-gray-300 p-1.5 text-center">
                      {s.daysLogged}/{entries.length}d
                    </td>
                    <td className="border border-gray-300 p-1.5 text-center">
                      {s.avgSeverity}/5
                    </td>
                    <td className="border border-gray-300 p-1.5">{s.peakPhase}</td>
                    <td className="border border-gray-300 p-1.5">{s.topTrigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <h2 className="font-bold text-xs uppercase tracking-wider mb-1.5">
            Recent Daily Logs
          </h2>
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-left">Date</th>
                <th className="border border-gray-300 p-1.5 text-left">Stage Cue</th>
                <th className="border border-gray-300 p-1.5">Fog</th>
                <th className="border border-gray-300 p-1.5">Focus</th>
                <th className="border border-gray-300 p-1.5">BP</th>
                <th className="border border-gray-300 p-1.5 text-left">Symptoms (1–5) &amp; Triggers</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(-7).map((e) => {
                const symFormatted = Object.entries(e.symptomScores || {}).map(
                  ([k, v]) => `${k} (${v}/5)`
                );
                const bpStr =
                  e.bpSystolic && e.bpDiastolic
                    ? `${e.bpSystolic}/${e.bpDiastolic}`
                    : "—";
                return (
                  <tr key={e.id}>
                    <td className="border border-gray-300 p-1.5">{e.date}</td>
                    <td className="border border-gray-300 p-1.5">
                      {e.hormonePhase || "—"}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-center">
                      {e.brainFog}/10
                    </td>
                    <td className="border border-gray-300 p-1.5 text-center">
                      {e.focus}/10
                    </td>
                    <td className="border border-gray-300 p-1.5 text-center">
                      {bpStr}
                    </td>
                    <td className="border border-gray-300 p-1.5">
                      {[...symFormatted, ...(e.triggers || [])].join(", ") || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-300 pt-2.5 text-xs space-y-1">
          <p className="font-bold">
            Cardiometabolic &amp; Endocrine Panels to Discuss With Your Physician:
          </p>
          <p>
            Full Lipid Profile (Total Cholesterol, LDL-C, HDL-C, Triglycerides,
            ApoB), Fasting Insulin, HbA1c, Fasting Glucose, hs-CRP, Blood
            Pressure review, TSH / Free T4, Total &amp; Free Testosterone,
            DHEA-S, Vitamin B12 &amp; Vitamin D.
          </p>
          <p className="text-[11px] text-gray-500 pt-0.5">
            Disclaimer: Educational self-tracking summary only; not a medical
            diagnosis. Seek prompt medical care for acute chest pain,
            shortness of breath, or syncope.
          </p>
        </div>
      </section>
    </div>
  );
}