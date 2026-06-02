export type Emotion = "alegria" | "tristeza" | "raiva" | "cansado" | "neutro";

export interface MoodEntry {
  id: string;
  name: string;
  emotion: Emotion;
  comment?: string;
  timestamp: number;
}

const KEY = "happiness-door-entries";

export const EMOTIONS: { id: Emotion; label: string; emoji: string; color: string }[] = [
  { id: "alegria", label: "Alegria", emoji: "😊", color: "oklch(0.82 0.15 90)" },
  { id: "tristeza", label: "Tristeza", emoji: "😢", color: "oklch(0.70 0.12 230)" },
  { id: "raiva", label: "Raiva", emoji: "😠", color: "oklch(0.62 0.20 25)" },
  { id: "cansado", label: "Cansado", emoji: "😴", color: "oklch(0.65 0.15 300)" },
  { id: "neutro", label: "Neutro", emoji: "😐", color: "oklch(0.70 0.04 250)" },
];

export function getEntries(): MoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addEntry(entry: Omit<MoodEntry, "id" | "timestamp">): MoodEntry {
  const full: MoodEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() };
  const all = getEntries();
  all.push(full);
  localStorage.setItem(KEY, JSON.stringify(all));
  return full;
}

export function isToday(ts: number) {
  const d = new Date(ts);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}
