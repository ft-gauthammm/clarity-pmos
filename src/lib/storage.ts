import { DailyLog } from "../types";

const STORAGE_KEY = "clarity-pmos-logs";

export function getLogs(): DailyLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLog(log: DailyLog): void {
  const logs = getLogs();
  const existingIndex = logs.findIndex((l) => l.date === log.date);

  if (existingIndex >= 0) {
    logs[existingIndex] = log;
  } else {
    logs.push(log);
  }

  // Keep only last 90 days
  const sorted = logs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 90);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

export function getLogByDate(date: string): DailyLog | undefined {
  return getLogs().find((l) => l.date === date);
}

export function deleteLog(date: string): void {
  const logs = getLogs().filter((l) => l.date !== date);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function clearAllLogs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
