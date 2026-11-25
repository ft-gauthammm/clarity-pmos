"use client";

import { useState, useEffect } from "react";
import { Sparkles, Droplets, Footprints, Heart, Pencil, Check } from "lucide-react";

interface CareCompanionProps {
  loggedToday: boolean;
  cognitiveDoneToday: boolean;
  streak: number;
  lastSleepHours?: number;
  lastFog?: number;
}

const PET_KEY = "clarity_pmos_pet_v1";
const HABIT_KEY = "clarity_pmos_habits_v6";

interface PetState {
  name: string;
  wateredDate: string;
  walkedDate: string;
  petsToday: number;
  petDate: string;
}

export default function CareCompanion({
  loggedToday,
  cognitiveDoneToday,
  streak,
  lastSleepHours,
  lastFog,
}: CareCompanionProps) {
  const [todayIso, setTodayIso] = useState("");
  const [pet, setPet] = useState<PetState>({
    name: "Mochi",
    wateredDate: "",
    walkedDate: "",
    petsToday: 0,
    petDate: "",
  });
  const [habitsDoneCount, setHabitsDoneCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("Mochi");
  const [bounce, setBounce] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayIso(iso);

    try {
      const rawPet = localStorage.getItem(PET_KEY);
      if (rawPet) {
        const parsed = JSON.parse(rawPet);
        if (parsed && typeof parsed === "object") {
          setPet((prev) => ({
            ...prev,
            ...parsed,
            petsToday: parsed.petDate === iso ? parsed.petsToday || 0 : 0,
          }));
          setDraftName(parsed.name || "Mochi");
        }
      }

      const rawHabits = localStorage.getItem(HABIT_KEY);
      if (rawHabits) {
        const parsedH = JSON.parse(rawHabits);
        if (parsedH && parsedH.date === iso && Array.isArray(parsedH.ids)) {
          setHabitsDoneCount(parsedH.ids.length);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistPet = (next: PetState) => {
    setPet(next);
    try {
      localStorage.setItem(PET_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const triggerBounce = (msg: string) => {
    setBounce(true);
    setToastMsg(msg);
    setTimeout(() => setBounce(false), 550);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const wateredToday = pet.wateredDate === todayIso;
  const walkedToday = pet.walkedDate === todayIso;

  // Care score (0–4) based on real self-care actions
  const carePoints =
    (loggedToday ? 1 : 0) +
    (cognitiveDoneToday ? 1 : 0) +
    (wateredToday || habitsDoneCount > 0 ? 1 : 0) +
    (walkedToday || habitsDoneCount >= 2 ? 1 : 0);

  // Evolution stage by streak
  const stage =
    streak >= 14 ? 4 : streak >= 7 ? 3 : streak >= 3 ? 2 : 1;

  const moodLabel =
    carePoints >= 3
      ? "Thriving & Focused"
      : carePoints >= 1
      ? "Awake & Cozy"
      : "Sleepy — Waiting for Check-In";

  const handlePetTap = () => {
    const nextPets = (pet.petDate === todayIso ? pet.petsToday : 0) + 1;
    persistPet({ ...pet, petsToday: nextPets, petDate: todayIso });

    if (!loggedToday) {
      triggerBounce(
        `${pet.name} stretches awake! Log today's PMOS signals to feed them.`
      );
    } else if (typeof lastSleepHours === "number" && lastSleepHours < 6.5) {
      triggerBounce(
        `${pet.name} purrs softly: "${lastSleepHours}h sleep is low—go gentle with protein & hydration today."`
      );
    } else if (typeof lastFog === "number" && lastFog >= 7) {
      triggerBounce(
        `${pet.name} leans in: "High brain fog lately—a 10-min post-meal walk helps steady energy."`
      );
    } else {
      triggerBounce(
        `${pet.name} is happy! (${nextPets} ${nextPets === 1 ? "pat" : "pats"} today)`
      );
    }
  };

  const handleWater = () => {
    if (!todayIso) return;
    persistPet({ ...pet, wateredDate: todayIso });
    triggerBounce(
      `${pet.name} drank morning water with you! Hydration logged.`
    );
  };

  const handleWalk = () => {
    if (!todayIso) return;
    persistPet({ ...pet, walkedDate: todayIso });
    triggerBounce(
      `${pet.name} went on a post-meal stroll with you!`
    );
  };

  const saveName = () => {
    const clean = draftName.trim().slice(0, 16) || "Mochi";
    persistPet({ ...pet, name: clean });
    setDraftName(clean);
    setEditingName(false);
  };

  return (
    <div className="bg-white/85 dark:bg-[#181D1A] border border-[#E3DDD2] dark:border-[#252B27] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
      {/* Left: Interactive SVG Botanical Companion */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePetTap}
          aria-label={`Pet ${pet.name}`}
          title={`Tap to pet ${pet.name}`}
          className={`relative w-20 h-20 rounded-2xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#2B322E] flex items-center justify-center shrink-0 cursor-pointer transition-transform ${
            bounce ? "scale-110 -translate-y-1" : "hover:scale-105"
          }`}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-16 h-16 overflow-visible"
            aria-hidden="true"
          >
            {/* Stage 4 aura */}
            {stage >= 4 && (
              <circle
                cx="50"
                cy="56"
                r="38"
                fill="none"
                stroke="#52A88E"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.7"
              />
            )}

            {/* Sprout / Leaf evolution on head */}
            <path
              d="M50 28 C50 18, 42 14, 38 18 C42 22, 47 24, 50 28 Z"
              fill="#2F5D50"
            />
            {stage >= 2 && (
              <path
                d="M50 26 C52 15, 62 12, 65 17 C60 21, 54 23, 50 26 Z"
                fill="#52A88E"
              />
            )}
            {stage >= 3 && (
              <circle cx="50" cy="14" r="3.5" fill="#D99B26" />
            )}

            {/* Soft botanical pebble body */}
            <ellipse
              cx="50"
              cy="60"
              rx="30"
              ry="26"
              fill={carePoints >= 1 ? "#2F5D50" : "#6E7570"}
            />
            <ellipse
              cx="50"
              cy="63"
              rx="22"
              ry="17"
              fill="#D9ECE6"
              opacity="0.92"
            />

            {/* Eyes: sleepy curved lines when 0 care points, bright eyes when awake */}
            {carePoints === 0 ? (
              <>
                <path
                  d="M37 56 Q41 60 45 56"
                  stroke="#1C1F1D"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M55 56 Q59 60 63 56"
                  stroke="#1C1F1D"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <text
                  x="72"
                  y="36"
                  fontSize="10"
                  fill="#6E7570"
                  fontWeight="bold"
                >
                  zZ
                </text>
              </>
            ) : (
              <>
                <circle cx="41" cy="55" r="3.2" fill="#1C1F1D" />
                <circle cx="59" cy="55" r="3.2" fill="#1C1F1D" />
                <circle cx="42" cy="54" r="1" fill="#FFFFFF" />
                <circle cx="60" cy="54" r="1" fill="#FFFFFF" />
              </>
            )}

            {/* Rosy cheeks & gentle smile */}
            <circle cx="34" cy="61" r="3" fill="#D98A7C" opacity="0.65" />
            <circle cx="66" cy="61" r="3" fill="#D98A7C" opacity="0.65" />
            <path
              d={
                carePoints >= 3
                  ? "M45 62 Q50 68 55 62"
                  : "M46 62 Q50 65 54 62"
              }
              stroke="#1C1F1D"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#1C1F1D] dark:bg-[#ECEAE4] text-[#F7F5F0] dark:text-[#111412] text-[10px] font-semibold">
            Stage {stage}
          </span>
        </button>

        {/* Companion Info & Nudge */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                  }}
                  maxLength={16}
                  className="w-28 rounded-lg bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] px-2 py-0.5 text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={saveName}
                  aria-label="Save companion name"
                  className="p-1 rounded-md bg-[#2F5D50] text-white cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="font-serif text-lg font-medium">
                  {pet.name}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  aria-label="Rename companion"
                  className="text-[#6E7570] hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}

            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] text-[#2F5D50] dark:text-[#66B89F]">
              {moodLabel}
            </span>
          </div>

          <p className="text-xs text-[#5A605C] dark:text-[#A4AAA6] max-w-md leading-relaxed">
            {toastMsg
              ? toastMsg
              : !loggedToday
              ? `Tap ${pet.name} or save today's PMOS check-in to wake them up and keep your streak blooming.`
              : carePoints < 4
              ? `${pet.name} is fed! Give water, log a short walk, or run a 15-sec focus sprint to reach full bloom.`
              : `${pet.name} is in full bloom today—all daily PMOS care signals completed!`}
          </p>

          {/* Care Progress Dots */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-[#6E7570] dark:text-[#8E9691]">
            <span className={loggedToday ? "text-[#2F5D50] dark:text-[#66B89F] font-semibold" : ""}>
              {loggedToday ? "✓" : "○"} Fed (Daily Log)
            </span>
            <span className={cognitiveDoneToday ? "text-[#2F5D50] dark:text-[#66B89F] font-semibold" : ""}>
              {cognitiveDoneToday ? "✓" : "○"} Brain Play
            </span>
            <span className={wateredToday ? "text-[#2F5D50] dark:text-[#66B89F] font-semibold" : ""}>
              {wateredToday ? "✓" : "○"} Hydrated
            </span>
            <span className={walkedToday ? "text-[#2F5D50] dark:text-[#66B89F] font-semibold" : ""}>
              {walkedToday ? "✓" : "○"} Walked
            </span>
          </div>
        </div>
      </div>

      {/* Right: Interactive Care Buttons */}
      <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0">
        <button
          type="button"
          onClick={handlePetTap}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#2F5D50] dark:hover:border-[#66B89F] text-xs font-semibold transition cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 text-[#A84A32]" /> Pet {pet.name}
        </button>

        <button
          type="button"
          onClick={handleWater}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
            wateredToday
              ? "bg-[#2F5D50]/15 dark:bg-[#52A88E]/20 border-[#2F5D50] dark:border-[#52A88E] text-[#2F5D50] dark:text-[#66B89F]"
              : "bg-[#F7F5F0] dark:bg-[#121614] border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#2F5D50]"
          }`}
        >
          <Droplets className="w-3.5 h-3.5" /> {wateredToday ? "Hydrated ✓" : "Give Water"}
        </button>

        <button
          type="button"
          onClick={handleWalk}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
            walkedToday
              ? "bg-[#2F5D50]/15 dark:bg-[#52A88E]/20 border-[#2F5D50] dark:border-[#52A88E] text-[#2F5D50] dark:text-[#66B89F]"
              : "bg-[#F7F5F0] dark:bg-[#121614] border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#2F5D50]"
          }`}
        >
          <Footprints className="w-3.5 h-3.5" /> {walkedToday ? "Walked ✓" : "Post-Meal Walk"}
        </button>
      </div>
    </div>
  );
}