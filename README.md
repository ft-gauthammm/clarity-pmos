# Clarity — PMOS Cognitive & Metabolic Companion

**Live Demo:** [clarity-pmos.vercel.app](https://clarity-pmos.vercel.app)

Clarity is a privacy-first, offline-capable web application built around the May 2026 global consensus renaming PCOS to **PMOS (Polyendocrine Metabolic Ovarian Syndrome)** and recent UCSF *Neurology* research examining cognitive links (memory, attention, and brain fog).

## Key Features
* **30-Second Daily Logger (`/track`):** Track brain fog, focus, energy, mood, sleep hours, cycle day, and metabolic signals locally in `localStorage` with zero accounts or cloud servers.
* **Objective Cognitive Mini-Tests:**
  * *20-Sec Attention & Working Memory Test* (reaction speed in ms + 3×3 sequence recall).
  * *15-Sec Stroop Focus Sprint* (verbal interference control with local high-score tracking).
* **On-Device Pattern Engine:** Automatically computes sleep-to-brain-fog correlations, recurring symptom frequencies, and rolling focus trends.
* **1-Click Clinical Doctor Brief:** Generates a clean, print-ready 1-page PDF summary with averages, detected correlations, recent logs, and metabolic screening panels (HbA1c, fasting insulin, thyroid, androgens) to discuss with a clinician.
* **PMOS Action Toolkit (`/guide`):** Interactive daily brain-fog reset habit checklist and lab screening guide grounded in Indian (NFHS-5 / MoHFW) and global clinical guidelines.

## Tech Stack
* **Framework:** Next.js 15 (App Router), TypeScript
* **Styling & Motion:** Tailwind CSS, Framer Motion, Lucide Icons
* **Data Visualization & Storage:** Recharts, `date-fns`, browser `localStorage` + JSON export

## Run Locally
```bash
npm install
npm run dev
