# Clarity — PMOS Cognitive & Metabolic Companion

**Live Demo:** `https://clarity-pmos.vercel.app`

Clarity is a privacy-first web application built around the PMOS (Polyendocrine Metabolic Ovarian Syndrome) clinical framing, perimenopause and cardiometabolic awareness, and observational research on cognitive patterns (memory, attention, and brain fog). All daily logs, symptom ratings, cognitive runs, and lab snapshots stay in the browser (`localStorage`) with zero accounts or backend servers, plus optional AES-256 encrypted local backups and a print-ready clinical summary.

## Key Features
- **Daily Signal & Individual Symptom Tracker (`/track`)**: Log brain fog, focus, energy, mood, sleep hours, optional blood pressure/resting heart rate, observable cycle/perimenopause cues (no phase guessing required), 1-tap triggers, and categorized individual symptoms (`1–5` severity + custom symptoms).
- **Cognitive Mini-Checks & 14-Day Baseline**: Includes a 20-second reaction & word-recall check and a 15-second Stroop sprint with rolling 14-day personal baseline comparisons.
- **On-Device Pattern & Symptom Engine**: Computes sample-size-guarded next-day correlations, cycle/stage overlays, and per-symptom breakdowns (frequency, average severity, peak stage, and top co-occurring trigger) locally in the browser.
- **1-Click Clinical Doctor Brief**: Generates a clean, print-ready summary with averages, individual symptom analysis, recent logs, lipid/glycemic snapshots, and metabolic/endocrine panels to discuss with a clinician.
- **AES-256 Encrypted Local Backup & Restore**: Export and re-import passphrase-protected `.clarity.enc` backup files locally with `MERGE`, `REPLACE`, or cancel options.
- **Action Toolkit & References (`/guide`)**: Date-scoped daily focus-support habit checklist, lab discussion guide, and linked clinical/public-health references.

## Tech Stack
- **Framework & Language**: Next.js (App Router), TypeScript
- **Styling & Icons**: Tailwind CSS, Lucide Icons
- **Charts, Dates & Local Persistence**: Recharts, `date-fns`, browser `localStorage`, Web Crypto API (`AES-GCM` / `PBKDF2`)

## Run Locally
```bash
npm install
npm run dev
