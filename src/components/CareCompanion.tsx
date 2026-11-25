"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Droplets,
  Footprints,
  Heart,
  Pencil,
  Check,
  ChevronDown,
  ArrowRight,
  Navigation,
} from "lucide-react";

interface CareCompanionProps {
  loggedToday: boolean;
  cognitiveDoneToday: boolean;
  streak: number;
  lastSleepHours?: number;
  lastFog?: number;
  showTrackerLink?: boolean;
}

const PET_KEY = "clarity_pmos_pet_v1";
const HABIT_KEY = "clarity_pmos_habits_v6";

interface PetState {
  name: string;
  wateredDate: string;
  walkedDate: string;
  petsToday: number;
  petDate: string;
  followCursor: boolean;
}

export default function CareCompanion({
  loggedToday,
  cognitiveDoneToday,
  streak,
  lastSleepHours,
  lastFog,
  showTrackerLink = false,
}: CareCompanionProps) {
  const [todayIso, setTodayIso] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [pet, setPet] = useState<PetState>({
    name: "Mochi",
    wateredDate: "",
    walkedDate: "",
    petsToday: 0,
    petDate: "",
    followCursor: true,
  });
  const [habitsDoneCount, setHabitsDoneCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("Mochi");
  const [isMoving, setIsMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [happyBurst, setHappyBurst] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Smooth cursor-following coordinates (bottom-right anchor offset)
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            followCursor:
              typeof parsed.followCursor === "boolean"
                ? parsed.followCursor
                : true,
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

  // Track pointer movement on desktop and smoothly trail behind
  useEffect(() => {
    const isCoarsePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (!pet.followCursor || expanded || isCoarsePointer) {
      targetRef.current = { x: 0, y: 0 };
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Keep companion comfortably inside viewport bounds with a playful offset
      const desiredOffsetX = Math.max(
        -(vw - 140),
        Math.min(0, e.clientX - (vw - 95))
      );
      const desiredOffsetY = Math.max(
        -(vh - 140),
        Math.min(40, e.clientY - (vh - 95))
      );

      if (Math.abs(desiredOffsetX - targetRef.current.x) > 4) {
        setFacingLeft(desiredOffsetX < currentRef.current.x);
      }

      targetRef.current = { x: desiredOffsetX, y: desiredOffsetY };
      setIsMoving(true);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => setIsMoving(false), 220);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    let rafId = 0;
    const tick = () => {
      const dx = targetRef.current.x - currentRef.current.x;
      const dy = targetRef.current.y - currentRef.current.y;
      currentRef.current.x += dx * 0.065;
      currentRef.current.y += dy * 0.065;

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${currentRef.current.x.toFixed(
          1
        )}px, ${currentRef.current.y.toFixed(1)}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafId);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [pet.followCursor, expanded]);

  const persistPet = (next: PetState) => {
    setPet(next);
    try {
      localStorage.setItem(PET_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const triggerHappy = (msg: string) => {
    setHappyBurst(true);
    setToastMsg(msg);
    setTimeout(() => setHappyBurst(false), 900);
    setTimeout(() => setToastMsg(""), 4200);
  };

  const wateredToday = pet.wateredDate === todayIso;
  const walkedToday = pet.walkedDate === todayIso;

  const carePoints =
    (loggedToday ? 1 : 0) +
    (cognitiveDoneToday ? 1 : 0) +
    (wateredToday || habitsDoneCount > 0 ? 1 : 0) +
    (walkedToday || habitsDoneCount >= 2 ? 1 : 0);

  const stage = streak >= 14 ? 4 : streak >= 7 ? 3 : streak >= 3 ? 2 : 1;

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
      triggerHappy(
        `${pet.name} perks up! Log today's PMOS check-in to feed them.`
      );
    } else if (typeof lastSleepHours === "number" && lastSleepHours < 6.5) {
      triggerHappy(
        `${pet.name} winks: "${lastSleepHours}h sleep is light—steady protein & hydration today."`
      );
    } else if (typeof lastFog === "number" && lastFog >= 7) {
      triggerHappy(
        `${pet.name} nudges gently: "Foggy stretch lately—try a short post-meal walk."`
      );
    } else {
      triggerHappy(
        `${pet.name} is happy to see you! (${nextPets} ${
          nextPets === 1 ? "pat" : "pats"
        } today)`
      );
    }
  };

  const handleWater = () => {
    if (!todayIso) return;
    persistPet({ ...pet, wateredDate: todayIso });
    triggerHappy(`${pet.name} sipped water with you! Hydration logged.`);
  };

  const handleWalk = () => {
    if (!todayIso) return;
    persistPet({ ...pet, walkedDate: todayIso });
    triggerHappy(`${pet.name} trotted along on a post-meal walk!`);
  };

  const toggleFollowCursor = () => {
    persistPet({ ...pet, followCursor: !pet.followCursor });
  };

  const saveName = () => {
    const clean = draftName.trim().slice(0, 16) || "Mochi";
    persistPet({ ...pet, name: clean });
    setDraftName(clean);
    setEditingName(false);
  };

  // Original textured fox-cub / forest companion SVG with sitting vs. trotting pose
  const renderCompanionSvg = (sizeClass = "w-16 h-16", flip = false) => (
    <svg
      viewBox="0 0 120 110"
      className={`${sizeClass} overflow-visible transition-transform duration-150 ${
        flip ? "-scale-x-100" : ""
      } ${isMoving ? "animate-mochi-trot" : "animate-mochi-breathe"}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="mochiFur" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#F6E2BE" />
          <stop offset="65%" stopColor="#DFB67E" />
          <stop offset="100%" stopColor="#B8874E" />
        </radialGradient>
        <linearGradient id="mochiEar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E7C28D" />
          <stop offset="100%" stopColor="#A6743D" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse
        cx="62"
        cy="98"
        rx={isMoving ? "34" : "28"}
        ry="6"
        fill="#000000"
        opacity="0.28"
      />

      {/* Tail: wagging/raised when trotting or happy, curled when sitting */}
      <path
        d={
          isMoving || happyBurst
            ? "M28 74 C10 62, 12 36, 26 42 C32 45, 30 62, 36 70 Z"
            : "M28 84 C12 84, 10 66, 24 66 C32 66, 32 78, 36 84 Z"
        }
        fill="url(#mochiFur)"
        stroke="#8C5E2C"
        strokeWidth="1.5"
      />

      {/* Back/front legs switch between sitting paws and trotting stride */}
      {isMoving ? (
        <>
          <ellipse
            cx="42"
            cy="88"
            rx="10"
            ry="6"
            transform="rotate(-22 42 88)"
            fill="#C7965C"
          />
          <ellipse
            cx="78"
            cy="86"
            rx="10"
            ry="6"
            transform="rotate(18 78 86)"
            fill="#E8C696"
          />
        </>
      ) : (
        <>
          <ellipse cx="44" cy="91" rx="9" ry="6" fill="#C7965C" />
          <ellipse cx="74" cy="91" rx="9" ry="6" fill="#E8C696" />
        </>
      )}

      {/* Torso */}
      <ellipse
        cx="58"
        cy="74"
        rx="26"
        ry={isMoving ? "18" : "21"}
        fill="url(#mochiFur)"
        stroke="#8C5E2C"
        strokeWidth="1.5"
      />
      {/* Soft cream chest patch */}
      <ellipse cx="73" cy="75" rx="11" ry="13" fill="#FFF7E6" opacity="0.75" />

      {/* Left & Right Floppy Ears */}
      <path
        d="M44 42 C28 38, 22 56, 32 64 C38 68, 44 56, 46 46 Z"
        fill="url(#mochiEar)"
        stroke="#8C5E2C"
        strokeWidth="1.5"
      />
      <path
        d="M78 40 C94 36, 100 54, 90 62 C84 66, 78 54, 76 44 Z"
        fill="url(#mochiEar)"
        stroke="#8C5E2C"
        strokeWidth="1.5"
      />

      {/* Head */}
      <circle
        cx="64"
        cy="46"
        r="23"
        fill="url(#mochiFur)"
        stroke="#8C5E2C"
        strokeWidth="1.5"
      />

      {/* Botanical sprout accessory on head (evolves with streak) */}
      <path
        d="M64 23 C64 14, 56 10, 52 14 C56 18, 61 20, 64 23 Z"
        fill="#2F5D50"
      />
      {stage >= 2 && (
        <path
          d="M64 22 C66 12, 75 10, 78 15 C73 18, 68 20, 64 22 Z"
          fill="#52A88E"
        />
      )}
      {stage >= 3 && <circle cx="64" cy="10" r="3" fill="#D99B26" />}

      {/* Eyes: happy arc when petted/happy, sleepy line when 0 care points, alert eyes otherwise */}
      {happyBurst ? (
        <>
          <path
            d="M54 45 Q58 40 62 45"
            stroke="#1C1F1D"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M71 45 Q75 40 79 45"
            stroke="#1C1F1D"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : carePoints === 0 ? (
        <>
          <path
            d="M54 46 Q58 49 62 46"
            stroke="#1C1F1D"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M71 46 Q75 49 79 46"
            stroke="#1C1F1D"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="58" cy="45" r="3.4" fill="#1C1F1D" />
          <circle cx="75" cy="45" r="3.4" fill="#1C1F1D" />
          <circle cx="59.1" cy="43.8" r="1.1" fill="#FFFFFF" />
          <circle cx="76.1" cy="43.8" r="1.1" fill="#FFFFFF" />
        </>
      )}

      {/* Cheek blush */}
      <ellipse cx="52" cy="51" rx="4" ry="2.4" fill="#E07A67" opacity="0.55" />
      <ellipse cx="81" cy="51" rx="4" ry="2.4" fill="#E07A67" opacity="0.55" />

      {/* Snout & Nose */}
      <ellipse cx="68" cy="51" rx="6" ry="4.5" fill="#FFF7E6" opacity="0.85" />
      <ellipse cx="69" cy="49" rx="3.2" ry="2.3" fill="#231F1E" />

      {/* Mouth */}
      <path
        d={happyBurst ? "M64 54 Q69 60 74 54" : "M65 54 Q69 57 73 54"}
        stroke="#231F1E"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div
      ref={containerRef}
      className="print:hidden fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2.5 will-change-transform"
    >
      {expanded && (
        <div className="w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-[#181D1A]/95 border border-[#D5CEC2] dark:border-[#2E3631] shadow-2xl backdrop-blur-md p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-[#EFECE6] dark:border-[#252B27] pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
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
                  <span className="font-serif text-base font-medium">
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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] text-[#2F5D50] dark:text-[#66B89F]">
                Stage {stage} · {moodLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse companion"
              className="p-1 rounded-lg text-[#6E7570] hover:text-[#1C1F1D] dark:hover:text-[#ECEAE4] cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePetTap}
              aria-label={`Pet ${pet.name}`}
              className="w-20 h-20 rounded-2xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#2B322E] flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              {renderCompanionSvg("w-16 h-16", false)}
            </button>

            <p className="text-xs text-[#5A605C] dark:text-[#A4AAA6] leading-relaxed">
              {toastMsg
                ? toastMsg
                : !loggedToday
                ? `${pet.name} is keeping you company! Log today's PMOS check-in to feed them and keep your streak going.`
                : carePoints < 4
                ? `${pet.name} is fed! Give water, log a post-meal walk, or do a quick focus test.`
                : `${pet.name} is thriving today—all daily PMOS care signals completed!`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E7570] dark:text-[#8E9691] bg-[#F7F5F0] dark:bg-[#121614] rounded-xl px-3 py-2">
            <span className={loggedToday ? "text-[#2F5D50] dark:text-[#66B89F] font-semibold" : ""}>
              {loggedToday ? "✓" : "○"} Fed
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

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handlePetTap}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full bg-[#F7F5F0] dark:bg-[#121614] border border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#2F5D50] text-[11px] font-semibold transition cursor-pointer"
            >
              <Heart className="w-3 h-3 text-[#A84A32]" /> Pet
            </button>

            <button
              type="button"
              onClick={handleWater}
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold transition cursor-pointer ${
                wateredToday
                  ? "bg-[#2F5D50]/15 dark:bg-[#52A88E]/20 border-[#2F5D50] dark:border-[#52A88E] text-[#2F5D50] dark:text-[#66B89F]"
                  : "bg-[#F7F5F0] dark:bg-[#121614] border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#2F5D50]"
              }`}
            >
              <Droplets className="w-3 h-3" /> {wateredToday ? "Water ✓" : "Water"}
            </button>

            <button
              type="button"
              onClick={handleWalk}
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold transition cursor-pointer ${
                walkedToday
                  ? "bg-[#2F5D50]/15 dark:bg-[#52A88E]/20 border-[#2F5D50] dark:border-[#52A88E] text-[#2F5D50] dark:text-[#66B89F]"
                  : "bg-[#F7F5F0] dark:bg-[#121614] border-[#D8D0C3] dark:border-[#2E3631] hover:border-[#2F5D50]"
              }`}
            >
              <Footprints className="w-3 h-3" /> {walkedToday ? "Walk ✓" : "Walk"}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFollowCursor}
            className="w-full inline-flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#F7F5F0] dark:bg-[#121614] border border-[#E3DDD2] dark:border-[#252B27] text-[11px] font-medium cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-[#2F5D50] dark:text-[#66B89F]" />
              Follow cursor on desktop
            </span>
            <span className="font-semibold text-[#2F5D50] dark:text-[#66B89F]">
              {pet.followCursor ? "On" : "Off"}
            </span>
          </button>

          {showTrackerLink && (
            <Link
              href="/track"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1F1D] hover:bg-[#2F5D50] dark:bg-[#52A88E] dark:hover:bg-[#66B89F] text-[#F7F5F0] dark:text-[#0F1311] text-xs font-semibold transition"
            >
              Open Tracker to Feed {pet.name} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Companion Trigger: sits cleanly in corner when expanded or cursor-follow is off */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={`Open ${pet.name} care panel`}
        className="group relative flex flex-col items-center cursor-pointer select-none focus:outline-none"
      >
        {!expanded && (
          <span className="mb-0.5 px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-[#181D1A]/95 border border-[#D5CEC2] dark:border-[#2E3631] shadow-sm text-[10px] font-semibold text-[#1C1F1D] dark:text-[#ECEAE4] opacity-90 group-hover:opacity-100 transition">
            {pet.name} · Stg {stage}
          </span>
        )}
        {renderCompanionSvg("w-28 h-28 sm:w-32 sm:h-32 drop-shadow-md", facingLeft)}
      </button>
    </div>
  );
}